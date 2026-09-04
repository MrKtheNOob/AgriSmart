import logging
import os
import json
import time
import httpx
from typing import Optional

from .schemas import PropertyResponse

logger = logging.getLogger(__name__)
DEFAULT_TOKEN_TTL = 3600  # 1 hour


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
                    logger.info("Stored token expired")
                    return None
            return token
        except Exception:
            logger.exception("Failed to read token file")
            return None

    async def get_soil_properties(
        self, lat: float, lon: float, depth: str = "0-20"
    ) -> PropertyResponse:
        """Fetch provider properties, refreshing authentication once if needed."""
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
                logger.info("Token invalid or expired; refreshing and retrying")
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
        # Validate at the adapter boundary so the analysis service never receives
        # an unstructured or malformed provider payload.
        return PropertyResponse(**response.json())

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
