from typing import Dict, Any
import logging
from services.climate.climate_service import ClimateMetrics
from services.soil.isdasoil_service import SoilProfile

logger = logging.getLogger(__name__)

class WaterInsightService:
    def __init__(self):
        pass

    async def get_water_insight(self, soil_data: SoilProfile, climate_data: ClimateMetrics) -> Dict[str, Any]:
        """
        Calculates Available Water Capacity (AWC) and provides insights on water retention.
        Heuristic based on Saxton and Rawls (2006).
        """
        raw = soil_data.raw_properties
        
        # Inputs (as percentages 0-100)
        clay = raw.get("clay_content", 20.0)
        sand = raw.get("sand_content", 40.0)
        om = raw.get("carbon_organic", 10.0) / 10.0 # g/kg to % approx
        
        # Available Water Capacity (AWC) estimation (cm/cm)
        # Simplified linear heuristic for demonstration
        # Sand has ~0.05, Loam ~0.15, Clay ~0.20
        awc = 0.05 + (0.0015 * clay) + (0.01 * om) - (0.0005 * sand)
        awc = max(0.02, min(0.25, awc))
        
        # Convert to percentage for user display (0-100 score)
        retention_score = (awc / 0.25) * 100
        
        # Categorization
        if retention_score < 30:
            category = "Faible (Drainage Rapide)"
            insight = "Le sol retient peu l'eau. Irrigation fréquente nécessaire."
        elif retention_score < 70:
            category = "Modérée (Équilibrée)"
            insight = "Bon compromis entre rétention et drainage. Idéal pour la plupart des cultures."
        else:
            category = "Élevée (Risque d'Asphyxie)"
            insight = "Forte rétention. Attention au drainage pour éviter le pourrissement des racines."

        return {
            "awc_value": round(awc, 3),
            "retention_score": round(retention_score, 1),
            "category": category,
            "insight": insight
        }
