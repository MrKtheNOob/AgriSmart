from __future__ import annotations

import logging
from typing import Type

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


logger = logging.getLogger(__name__)


def normalize_db_url(db_url: str) -> str:
    url = db_url.strip().strip('"').strip("'")
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


class DatabaseService:
    def __init__(self, db_url: str):
        self.db_url = normalize_db_url(db_url)
        self.engine: AsyncEngine | None = None
        self.sessionmaker: async_sessionmaker[AsyncSession] | None = None

    async def connect(self):
        if self.engine is not None:
            return

        self.engine = create_async_engine(self.db_url, pool_pre_ping=True)
        self.sessionmaker = async_sessionmaker(self.engine, expire_on_commit=False)
        logger.info("SQLAlchemy async engine created.")

    def get_sessionmaker(self) -> async_sessionmaker[AsyncSession]:
        if self.sessionmaker is None:
            raise RuntimeError("Database sessionmaker is not initialized.")
        return self.sessionmaker

    async def create_tables(self, base: Type):
        if self.engine is None:
            raise RuntimeError("Database engine is not initialized.")

        async with self.engine.begin() as conn:
            await conn.run_sync(base.metadata.create_all)

    async def close(self):
        if self.engine is not None:
            await self.engine.dispose()
            self.engine = None
            self.sessionmaker = None
            logger.info("SQLAlchemy engine closed.")
