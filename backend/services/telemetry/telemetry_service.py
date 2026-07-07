from __future__ import annotations

import logging

from sqlalchemy import Float, Integer, JSON, String, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from shared.database_service import DatabaseService



logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


class Telemetry(Base):
    __tablename__ = "telemetry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[str | None] = mapped_column("sessionid", String(128), nullable=True, index=True)
    event_type: Mapped[str] = mapped_column("type", String(32), nullable=False, index=True)
    x: Mapped[float | None] = mapped_column(Float, nullable=True)
    y: Mapped[float | None] = mapped_column(Float, nullable=True)
    data: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)


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

    async def _log_event(
        self,
        event_type: str,
        session_id: str | None,
        lat: float | None = None,
        lng: float | None = None,
        data: dict | list | None = None,
    ):
        try:
            if not session_id:
                return

            sessionmaker = self.db_service.get_sessionmaker()
            async with sessionmaker() as session:
                session.add(
                    Telemetry(
                        session_id=session_id,
                        event_type=event_type,
                        x=lat,
                        y=lng,
                        data=data,
                    )
                )
                await session.commit()
            logger.info("Logged telemetry %s", event_type)
        except Exception as e:
            logger.error(f"Error logging telemetry: {e}")

    async def log_visit(self, session_id: str | None):
        await self._log_event("visit", session_id)

    async def log_analysis(
        self,
        session_id: str | None,
        lat: float | None,
        lng: float | None,
        data: dict | list | None,
    ):
        await self._log_event("analysis", session_id, lat, lng, data)

    async def log_download(
        self,
        session_id: str | None,
        lat: float | None,
        lng: float | None,
        data: dict | list | None,
    ):
        await self._log_event("download_pdf", session_id, lat, lng, data)

    async def get_device_count(self) -> int:
        try:
            sessionmaker = self.db_service.get_sessionmaker()
            async with sessionmaker() as session:
                result = await session.execute(
                    select(func.count(func.distinct(Telemetry.session_id))).where(
                        Telemetry.event_type == "visit",
                        Telemetry.session_id.isnot(None),
                    )
                )
                return int(result.scalar_one() or 0)
        except Exception as e:
            logger.error(f"Error fetching telemetry device count: {e}")
            return 0
