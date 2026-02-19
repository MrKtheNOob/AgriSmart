import os
import logging
from dotenv import load_dotenv
import asyncio
from langchain_openai import ChatOpenAI

from climate_service import ClimateMetrics
from isdasoil_service import SoilProfile
from vector_store import VectorStore

logger = logging.getLogger(__name__)


PROMPT = """
You are a senior agronomic analyst specializing in semi-arid environments.

Use the provided environmental data and the knowledge base context
to evaluate crop suitability.

Environmental Data:

Soil Profile (structured):
{soil_data}

Climate Profile (structured):
{climate_json}

Knowledge Base Context:
{context}

Analysis Instructions:

1. Evaluate soil suitability:
   - Texture class
   - pH level
   - Organic carbon
   - Cation exchange capacity

2. Evaluate climate suitability:
   - Average annual temperature
   - Average annual precipitation
   - Interannual variability
   - Heat or frost risk if relevant

3. Recommend up to 3 crops that are realistically viable
   under these exact conditions.

4. For each crop:
   - Reference at least one soil parameter numerically
   - Reference at least one climate parameter numerically
   - Mention one potential risk or limitation
   - Keep reasoning concise but technically grounded

Strict Rules:
- Use only the provided data.
- Do NOT invent environmental metrics.
- Do NOT assume irrigation unless explicitly stated.
- If conditions are limiting, acknowledge it.

Return ONLY valid JSON in this format:

{{
  "recommended_crops": [
    {{
      "name": "Crop name",
      "reason": "Technically grounded explanation referencing soil and climate values."
    }}
  ]
}}
"""



class RAGService:
    def __init__(
        self,
        vector_service: VectorStore,
        llm_model: str = "openai/gpt-4o-mini",
        base_url: str = "https://openrouter.ai/api/v1",
        api_key_env: str = "OPENAI_API_KEY",
    ):
        logger.info(f"Initializing RAGService with model={llm_model}")
        load_dotenv()
        os.environ["OPENAI_API_KEY"] = os.getenv(api_key_env)

        self.vector_service = vector_service

        self.llm = ChatOpenAI(
            model=llm_model,
            base_url=base_url,
        )
        logger.debug(f"RAGService initialized successfully")
    def build_rag_query(self,soil: SoilProfile, climate: ClimateMetrics) -> str:
        props = soil.properties

        # Extract key soil indicators safely
        texture = props.get("USDA Texture Class", "Unknown")
        ph = props.get("pH", "Unknown")
        organic_carbon = props.get("Carbon, organic", "Unknown")
        clay = props.get("Clay content", "Unknown")
        sand = props.get("Sand content", "Unknown")
        cec = props.get("Effective Cation Exchange Capacity", "Unknown")

        # Compute climate averages
        years = list(climate.annual_stats.values())
        avg_temp = sum(y["temperature_2m"] for y in years) / len(years)
        avg_precip = sum(y["precipitation"] for y in years) / len(years)

        heat_days = climate.heat_days
        frost_days = climate.frost_days

        query = f"""
        Agronomic conditions in Morocco:

        Soil classification: {soil.classification}
        Texture: {texture}
        pH: {ph}
        Organic carbon: {organic_carbon}
        Clay content: {clay}
        Sand content: {sand}
        Cation exchange capacity: {cec}

        Climate (6-year average):
        Average temperature: {avg_temp:.1f} °C
        Average annual precipitation: {avg_precip:.1f} mm
        Heat stress days per year: {heat_days}
        Frost days per year: {frost_days}

        Which crops are agronomically suitable for these conditions?
        """

        return query.strip()

    async def generate_recommendation(self, soil_data: dict, climate_data: dict):
        logger.info("Generating crop recommendation using RAG")
        try:
            query = self.build_rag_query(soil_data, climate_data)
            logger.debug(f"RAG query: {query[:100]}...")

            # vector search may be blocking depending on driver — use async wrapper
            docs = await self.vector_service.similarity_search(query, k=5)
            logger.info(f"Retrieved {len(docs)} relevant documents from vector store")
            context = "\n\n".join([doc.page_content for doc in docs])

            prompt = PROMPT.format(
                soil_data=soil_data,
                climate_json=climate_data,
                context=context,
            )
            logger.debug("Invoking LLM for crop recommendations")

            # Run possibly-blocking LLM invoke in thread
            response = await asyncio.to_thread(self.llm.invoke, prompt)
            logger.info("Successfully generated crop recommendation")
            # ChatOpenAI invoke may return a structured object; attempt to extract text
            return getattr(response, "content", str(response))
        except Exception as e:
            logger.error(f"Error generating recommendation: {str(e)}", exc_info=True)
            raise
