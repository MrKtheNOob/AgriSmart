import asyncio
import json
import logging
import os
from datetime import UTC, datetime

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from services.RAG.vector_store import VectorStore
from services.climate.climate_service import ClimateMetrics
from services.crops.crop_ranking_service import CropRankingResult
from services.soil.schemas import SoilProfile


logger = logging.getLogger(__name__)


PROMPT = """
You are a senior agronomic analyst specializing in Senegal and semi-arid environments.

The crops below have already been selected and ordered by a deterministic suitability
algorithm. You are an explanation layer, not a recommendation or scoring engine.

Current date (UTC, also Senegal local time): {current_date}
For each crop, focus on the growing window starting at its planting_month and
lasting growing_months, wrapping into the next year when necessary. Use the
corresponding monthly climate records to describe upcoming seasonal conditions.
These records are historical monthly averages, not weather forecasts. Describe
what is typically favorable or unfavorable, without promising future weather.
The climate score currently measures temperature suitability only. Humidity and
rainfall may inform evidence-supported caveats, but are not included in that score.
Suitability percentages are index scores, not probabilities of harvest success.

Authoritative crop rankings:
{rankings_json}

Soil profile:
{soil_json}

Climate profile:
{climate_json}

Retrieved agronomic knowledge:
{context}

For each ranked crop, write one concise but technically grounded explanation in French.
Reference relevant measured soil and climate values, explain why the score is plausible,
and mention one important risk or limitation when supported by the supplied evidence.

Strict rules:
- Return exactly {ranking_count} explanations in the same order as the rankings.
- Do not select, add, remove, reorder, rename, or translate crop names.
- Do not calculate, change, or contradict the supplied scores.
- Do not assume irrigation or other unavailable conditions.
- Use only the supplied environmental data and retrieved knowledge.
- Write explanation text in French.
- Keep the JSON attribute name exactly as shown below.
- Return only valid JSON without a Markdown code block.

{{
  "explanations": [
    "Explication du premier résultat...",
    "Explication du deuxième résultat...",
    "Explication du troisième résultat..."
  ]
}}
"""


class ExplanationPayload(BaseModel):
    explanations: list[str]


class RAGService:
    def __init__(
        self,
        vector_service: VectorStore,
        profit_data_path: str | None = None,
        llm_model: str = "openai/gpt-4o-mini",
        base_url: str = "https://openrouter.ai/api/v1",
        api_key_env: str = "OPENAI_API_KEY",
    ):
        logger.info("Initializing RAGService with model=%s", llm_model)
        load_dotenv()
        os.environ["OPENAI_API_KEY"] = os.environ[api_key_env]

        self.vector_service = vector_service
        self.profit_data = None
        if profit_data_path:
            logger.info(
                "Profit data path provided, but profitability context is disabled"
            )

        self.llm = ChatOpenAI(model=llm_model, base_url=base_url)
        logger.debug("RAGService initialized successfully")

    @staticmethod
    def build_rag_query(
        soil: SoilProfile,
        climate: ClimateMetrics,
        rankings: list[CropRankingResult],
    ) -> str:
        crop_names = ", ".join(ranking.crop_name for ranking in rankings)
        raw = soil.raw_properties
        summary = climate.summary
        return (
            f"Contexte agronomique au Sénégal pour {crop_names}. "
            f"Sol {soil.classification}, pH {raw['ph']}, carbone organique "
            f"{raw['carbon_organic']} g/kg, argile {raw['clay_content']} %, "
            f"sable {raw['sand_content']} %, CEC "
            f"{raw['cation_exchange_capacity']} cmol/kg. Climat historique: "
            f"température moyenne {summary.temperature_mean_c:.1f} °C, "
            f"précipitations annuelles {summary.annual_precipitation_mean_mm:.1f} mm, "
            f"{summary.heat_days_mean} jours chauds et "
            f"{summary.rainy_days_mean} jours pluvieux. Expliquer les risques, "
            "besoins en eau et contraintes de ces cultures sans en proposer d'autres."
        )

    @staticmethod
    def _parse_explanations(content: object, expected_count: int) -> list[str]:
        if not isinstance(content, str):
            raise TypeError("The LLM response content must be a JSON string")

        cleaned = content.replace("```json", "").replace("```", "").strip()
        payload = ExplanationPayload.model_validate_json(cleaned)
        if len(payload.explanations) != expected_count:
            raise ValueError(
                f"Expected {expected_count} explanations, received "
                f"{len(payload.explanations)}"
            )
        if any(not explanation.strip() for explanation in payload.explanations):
            raise ValueError("Every ranked crop must have a non-empty explanation")
        return payload.explanations

    async def generate_recommendation(
        self,
        soil_data: SoilProfile,
        climate_data: ClimateMetrics,
        crop_rankings: list[CropRankingResult],
    ) -> dict[str, list[dict[str, str | float]]]:
        """Explain authoritative rankings without allowing the LLM to rename crops."""
        logger.info(
            "Generating explanations for ranked crops: %s",
            ", ".join(ranking.crop_name for ranking in crop_rankings),
        )
        current_date = datetime.now(UTC).date().isoformat()
        query = self.build_rag_query(soil_data, climate_data, crop_rankings)
        docs = await self.vector_service.similarity_search(query, k=6)
        logger.info("Retrieved %s relevant documents from vector store", len(docs))
        context = "\n\n".join(document.page_content for document in docs)

        prompt = PROMPT.format(
            current_date=current_date,
            rankings_json=json.dumps(
                [ranking.model_dump() for ranking in crop_rankings],
                ensure_ascii=False,
                indent=2,
            ),
            ranking_count=len(crop_rankings),
            soil_json=soil_data.model_dump_json(indent=2),
            climate_json=climate_data.model_dump_json(indent=2),
            context=context,
        )
        response = await asyncio.to_thread(self.llm.invoke, prompt)
        explanations = self._parse_explanations(
            getattr(response, "content", None),
            len(crop_rankings),
        )

        recommended_crops = [
            {
                "name": ranking.crop_name,
                "reason": explanation,
                "soil_score": ranking.soil_score,
                "climate_score": ranking.climate_score,
                "overall_score": ranking.overall_score,
            }
            for ranking, explanation in zip(
                crop_rankings,
                explanations,
                strict=True,
            )
        ]
        logger.info("Successfully generated ranked-crop explanations")
        return {"recommended_crops": recommended_crops}
