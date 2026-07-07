import logging
import os
import json
import time
from dotenv import load_dotenv
import httpx
from pydantic import BaseModel, Field
import asyncio
from typing import List, Dict, Optional, Any, Union

logger = logging.getLogger(__name__)
DEFAULT_TOKEN_TTL = 3600  # 1 hour


# --- Existing Data Models ---
class SoilPropertyValue(BaseModel):
    value: Optional[Union[float, int, str]] = None
    unit: Optional[str] =None
    type: str = "float"


class SoilPropertyDepth(BaseModel):
    value: Optional[str] = Field(None, description="The depth range (e.g., '0-20')")
    unit: Optional[str] = None


class SoilData(BaseModel):
    value: SoilPropertyValue
    depth: SoilPropertyDepth
    # We can keep uncertainty optional as per schema
    uncertainty: Optional[Any] = None


# --- New Metadata Models (The "Info") ---
class LayersDepth(BaseModel):
    unit: Optional[str] = None
    values: List[str]


class SoilPropertyMetadata(BaseModel):
    description: str = Field(..., description="Human-readable explanation")
    theme: str = Field(..., description="Category: Chemistry, Physics, etc.")
    unit: Optional[str] = None
    depths: LayersDepth


class PropertyResponse(BaseModel):
    property: Dict[str, List[SoilData]]


class SoilProfile(BaseModel):
    target_depth: str = "0-20cm"
    classification: str
    properties: Dict[str, str]  # Human readable strings
    raw_properties: Dict[str, float] = {}  # Raw values for calculations

class DesertLandError(Exception):
    """Raised when ISDAsoil's API returns {"detail":"Please choose another location. We don't have soil data for deserts, waterbodies, and areas outside Africa."}"""
    pass

class iSDAsoilService:
    def __init__(self, email: str, password: str):
        self.base_url = "https://api.isda-africa.com/isdasoil/v2"
        self.email = email
        self.password = password
        self._token = None
        self._token_file = os.path.join(
            os.path.dirname(__file__), "../../data/isdasoil_token.json"
        )
        self._metadata: Dict[Any, SoilPropertyMetadata] = self._fetch_metadata()
        self.client = httpx.AsyncClient(timeout=15.0)

        loaded = self._load_token()
        if loaded:
            self._token = loaded

    async def _get_token(self):
        """Authenticates using the /login endpoint."""
        login_url = "https://api.isda-africa.com/login"
        data = {
            "username": self.email,
            "password": self.password,
        }

        response = await self.client.post(login_url, data=data)
        response.raise_for_status()
        j = response.json()
        token = j.get("access_token") or j.get("token")
        expires_in = j.get("expires_in")
        if not token:
            raise RuntimeError("Login did not return an access token")
        self._token = token
        # save token for future runs; if API returns expires_in (seconds) store expiry
        self._save_token(token, expires_in)

    def _save_token(self, token: str, expires_in: Optional[int] = None):
        ttl = expires_in or DEFAULT_TOKEN_TTL
        payload = {
            "access_token": token,
            "expires_at": int(time.time()) + int(ttl) - 60,  # refresh 1 min early
        }
        with open(self._token_file, "w") as f:
            json.dump(payload, f)

    def _load_token(self) -> Optional[str]:
        if not os.path.exists(self._token_file):
            return None
        try:
            with open(self._token_file, "r") as f:
                payload = json.load(f)
            token = payload.get("access_token")
            expires_at = payload.get("expires_at")
            if token and expires_at:
                if int(time.time()) >= int(expires_at):
                    logging.info("Stored token expired")
                    return None
            return token
        except Exception:
            logging.exception("Failed to read token file")
            return None

    def _fetch_metadata(self):
        """Fetches the 'info' about what each property means."""
        try:
            metadata_path = os.path.join(
                os.path.dirname(__file__), "../../data/processed/soil_metadata.json"
            )
            with open(metadata_path, "r") as f:
                data = json.load(f)
            data = {k: SoilPropertyMetadata(**v) for k, v in data["property"].items()}
            return data
        except Exception as e:
            logging.error(f"Could not load metadata info: {e}")
            raise

    def _translate_property_label(self, prop_name: str, description: str) -> str:
        if prop_name == "USDA Texture Class":
            return "Classe texturale (USDA)"
        return description

    def _translate_texture_class(self, value: str) -> str:
        translations = {
            "Sand": "Sable",
            "Loamy Sand": "Sable limoneux",
            "Sandy Loam": "Limon sableux",
            "Sandy Clay Loam": "Limon argilo-sableux",
            "Clay Loam": "Limon argileux",
            "Silty Clay Loam": "Limon argilo-limoneux",
            "Silty Clay": "Argile limoneuse",
            "Silt Loam": "Limon",
            "Silt": "Limon fin",
            "Loam": "Limon franc",
            "Sandy Clay": "Argile sableuse",
            "Clay": "Argile",
            "Clayey Sand": "Sable argileux",
        }
        return translations.get(value, value)
    async def _fetch_soil_data(
        self, lat: float, lon: float, depth: str
    ) -> PropertyResponse:
        """Internal method to fetch and validate soil data with token retry logic."""
        if not self._is_token_valid():
            await self._get_token()

        params = {"lat": lat, "lon": lon, "depth": depth}
        headers = {"Authorization": f"Bearer {self._token}"}

        response = await self.client.get(
            f"{self.base_url}/soilproperty", params=params, headers=headers
        )
        match response.status_code:
            # If token expired or invalid, try obtaining a new token and retry once
            case 401 | 403:
                logging.info("Token invalid or expired, refreshing token , retrying ...")
                await self._get_token()
                headers = {"Authorization": f"Bearer {self._token}"}
                response = await self.client.get(
                    f"{self.base_url}/soilproperty", params=params, headers=headers
                )
            case 400:
                if response.json()["detail"]=="Please choose another location. We don't have soil data for deserts, waterbodies, and areas outside Africa.":
                    raise DesertLandError 

        # logger.warning(response.text)
        # response.raise_for_status()
        validated_data = PropertyResponse(**response.json())
        print(f"validated_data: {validated_data}")
        return validated_data

    def _is_token_valid(self) -> bool:
        if not self._token:
            return False

        if not os.path.exists(self._token_file):
            return False

        with open(self._token_file, "r") as f:
            payload = json.load(f)

        expires_at = payload.get("expires_at")
        if not expires_at:
            return False

        return time.time() < expires_at

    async def get_soil_analysis(
        self, lat: float, lon: float, depth: str = "0-20"
    ) -> SoilProfile:
        """Fetch soil analysis with token validation and metadata enrichment."""
        try:
            validated_data = await self._fetch_soil_data(lat, lon, depth)
            response=await self._interpret_agronomy(validated_data)
            
            # Post cleaning
            response.properties["pH"]=response.properties["pH"].replace("None", "").strip()  
            texture_key = next(
                (
                    key
                    for key in ("Classe texturale (USDA)", "USDA Texture Class")
                    if key in response.properties
                ),
                None,
            )
            if texture_key:
                response.properties[texture_key] = response.properties[texture_key].replace("None", "").strip()
            
            return response

        except DesertLandError:
            raise
        
        except Exception as e:
            logging.error(f"API Error: {e}")
            raise

    async def _interpret_agronomy(self, data: PropertyResponse) -> SoilProfile:
        properties = {}
        raw_properties = {}

        for prop_name, measurements in data.property.items():
            if not measurements:
                continue

            val_obj = measurements[0].value
            actual_value = val_obj.value

            # Store raw value for calculations
            if actual_value is None:
                continue
            try:
                raw_properties[prop_name] = float(actual_value)
            except (ValueError, TypeError):
                pass

            meta = self._metadata.get(prop_name)
            description = meta.description if meta else prop_name
            unit = val_obj.unit or (meta.unit if meta else "")

            display_description = self._translate_property_label(prop_name, description)
            display_value = actual_value
            if prop_name == "USDA Texture Class" and isinstance(actual_value, str):
                display_value = self._translate_texture_class(actual_value)

            properties[display_description] = f"{display_value} {unit}".strip()

        soil_type = self._classify_senegal_soil(raw_properties)

        return SoilProfile(
            target_depth="0-20 centimeters",
            classification=soil_type,
            properties=properties,
            raw_properties=raw_properties,
        )
    def _classify_senegal_soil(self, raw_properties: Dict[str, float]) -> str:
        """
        First principles mapping of soil chemical/physical properties 
        to Senegalese vernacular taxonomy.
        """
        # Safely extract properties (defaulting to neutral/zero if missing)
        sand = raw_properties.get("sand_content", 0.0) 
        clay = raw_properties.get("clay_content", 0.0)
        silt = raw_properties.get("silt_content", 0.0)
        ph = raw_properties.get("ph", 6.5) 
        soc = raw_properties.get("carbon_organic", 0.0) # Assumed g/kg

        # 1. Chemical Limiters First
        # Tannes (Acid Sulphate / Halomorphic) - Sine-Saloum / Casamance
        if ph <= 5.0:
            return "Tanne (Acide sulfatique / Salin) - Risque élevé de toxicité"

        # Sols des Niayes (Organic Sandy) - Coastal depressions
        if soc >= 15.0 and sand >= 50.0:
            return "Niayes (Sable organique / tourbeux) - Potentiel élevé de maraîchage"

        # 2. Textural Classification
        # Hollaldé (Heavy Clay / Vertisols) - Vallée du Fleuve
        if clay >= 40.0:
            return "Hollaldé (Argile lourde / Vertisol) - Idéal pour le riz inondé"

        # Fondé (Clay Loam / Alluvial) - Senegal Riverbanks
        if 20.0 <= clay < 40.0 and silt >= 20.0:
            return "Fondé (Limons argileux alluviaux) - Fertilité naturelle élevée"

        # Deck (Hydromorphic Clay) - Bassin Arachidier depressions
        if 20.0 <= clay < 40.0 and silt < 20.0:
            return "Deck (Argile hydromorphe) - Bonne rétention d'eau"

        # Dior (Sandy Ferruginous) - Classic Bassin Arachidier soil
        if sand >= 80.0 and clay <= 10.0:
            return "Dior (Sableux ferrugineux) - Drainage élevé, nécessite fertilisation"

        # Deck-Dior (Transitional)
        if 60.0 <= sand < 80.0 and 10.0 < clay < 20.0:
            return "Deck-Dior (Sable limoneux transitionnel)"

        return "Indéterminé (Profil mixte) - Nécessite une analyse locale"
    


load_dotenv()

soil_service = iSDAsoilService(
    email=os.getenv("ISDA_EMAIL",""), password=os.getenv("ISDA_PASSWORD","")
)

if __name__ == "__main__":
    # Example async usage
    async def main():
        result = await soil_service.get_soil_analysis(
            lat=29.304, lon=-9.157, depth="0-20"
        )
        with open("soildataexample.json", "w") as f:
            json.dump(result.model_dump(), f, indent=2)

    asyncio.run(main())
