from typing import List, Dict
import pandas as pd


class CropProfitabilityService:
    """
    Loads crop profitability data from CSV and computes
    climate-adjusted KPIs for ranking.
    """

    WATER_MAP = {
        "Low": 0.2,
        "Medium": 0.5,
        "Medium/High": 0.7,
        "High": 0.9,
        "High (Rainfed)": 0.8,
        "High (Irrigated)": 1.0,
    }

    def __init__(
        self,
        csv_path: str = "../files/morroco_crop_profit.csv",
        water_penalty_factor: float = 0.5,
        input_penalty_weight: float = 0.5,
        volatility_penalty_weight: float = 0.4,
    ):
        """
        csv_path: path to your cleaned crop table
        water_penalty_factor: adjust based on climate regime (0.3–0.9 typical)
        """

        self.water_penalty_factor = water_penalty_factor
        self.input_penalty_weight = input_penalty_weight
        self.volatility_penalty_weight = volatility_penalty_weight

        # Load CSV
        self.df = pd.read_csv(csv_path)

        # Clean column names (optional safety)
        self.df.columns = self.df.columns.str.strip()

        self.df["Avg Farmgate Price ($/t)"] = (
            self.df["Avg Farmgate Price ($/t)"]
            .astype(str)
            .str.replace(
                ".", "", regex=False
            )  # remove periods used as thousands separators
            .astype(float)
        )
        # Ensure numeric types
        numeric_cols = [
            "Avg Yield (t/ha)",
            "Avg Farmgate Price ($/t)",
            "Input Intensity (0-1)",
            "Price Volatility (0-1)",
        ]

        for col in numeric_cols:
            self.df[col] = pd.to_numeric(self.df[col], errors="coerce")

        # Normalize water dependency
        self.df["Water Dependency Score"] = (
            self.df["Water Dependency"]
            .astype(str)
            .str.strip()
            .map(self.WATER_MAP)
            .fillna(0.5)
        )

    def compute_kpis(self) -> List[Dict]:

        df = self.df.copy()

        # Revenue per hectare
        df["Revenue_per_ha"] = df["Avg Yield (t/ha)"] * df["Avg Farmgate Price ($/t)"]

        # Normalize revenue
        max_revenue = df["Revenue_per_ha"].max()
        df["Normalized_Revenue"] = df["Revenue_per_ha"] / max_revenue

        # Profitability index
        df["Profitability_Index"] = (
            df["Normalized_Revenue"]
            * (1 - df["Input Intensity (0-1)"] * self.input_penalty_weight)
            * (1 - df["Water Dependency Score"] * self.water_penalty_factor)
            * (1 - df["Price Volatility (0-1)"] * self.volatility_penalty_weight)
        )

        df = df.sort_values(by="Profitability_Index", ascending=False)

        result = df[
            [
                "Crop",
                "Crop Category",
                "Revenue_per_ha",
                "Normalized_Revenue",
                "Profitability_Index",
                "Input Intensity (0-1)",
                "Water Dependency Score",
                "Price Volatility (0-1)",
                "Year",
            ]
        ]

        return result.to_json("../files/morroco_crop_profit.json", orient="records",indent=2)


if __name__ == "__main__":
    service = CropProfitabilityService()
    service.compute_kpis()
