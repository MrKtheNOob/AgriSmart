from __future__ import annotations

from datetime import datetime
import logging

from sqlalchemy import DateTime, Float, Integer, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from shared.database_service import DatabaseService



logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


class AnalysisTelemetry(Base):
    __tablename__ = "analysis_telemetry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class TelemetryService:
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service

    async def init_table(self):
        try:
            await self.db_service.create_tables(Base)
            logger.info("Telemetry table ensured.")
        except Exception as e:
            logger.error(f"Failed to initialize telemetry table: {e}")
            raise

    async def log_analysis(self, lat: float, lng: float):
        try:
            sessionmaker = self.db_service.get_sessionmaker()
            async with sessionmaker() as session:
                session.add(AnalysisTelemetry(latitude=lat, longitude=lng))
                await session.commit()
            logger.info(f"Logged telemetry: lat={lat}, lng={lng}")
        except Exception as e:
            logger.error(f"Error logging telemetry: {e}")

    async def get_analysis_count(self) -> int:
        try:
            sessionmaker = self.db_service.get_sessionmaker()
            async with sessionmaker() as session:
                result = await session.execute(
                    select(func.count()).select_from(AnalysisTelemetry)
                )
                return int(result.scalar_one() or 0)
        except Exception as e:
            logger.error(f"Error fetching analysis count: {e}")
            return 0
