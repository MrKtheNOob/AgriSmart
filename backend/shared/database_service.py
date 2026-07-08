from __future__ import annotations

import logging
from typing import Type

from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.schema import CreateColumn


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

    async def ensure_schema(self, base: Type):
        if self.engine is None:
            raise RuntimeError("Database engine is not initialized.")

        async with self.engine.begin() as conn:
            def sync_ensure_schema(sync_conn):
                base.metadata.create_all(sync_conn)
                inspector = inspect(sync_conn)
                existing_tables = set(inspector.get_table_names())
                identifier_preparer = sync_conn.dialect.identifier_preparer

                for table in base.metadata.sorted_tables:
                    if table.name not in existing_tables:
                        continue

                    existing_columns = {
                        column["name"] for column in inspector.get_columns(table.name)
                    }
                    for column in table.columns:
                        if column.name in existing_columns:
                            continue

                        column_sql = str(
                            CreateColumn(column).compile(dialect=sync_conn.dialect)
                        ).strip()
                        table_sql = identifier_preparer.quote(table.name)
                        logger.info("Adding missing column %s.%s", table.name, column.name)
                        sync_conn.execute(
                            text(f"ALTER TABLE {table_sql} ADD COLUMN {column_sql}")
                        )

            await conn.run_sync(sync_ensure_schema)

    async def close(self):
        if self.engine is not None:
            await self.engine.dispose()
            self.engine = None
            self.sessionmaker = None
            logger.info("SQLAlchemy engine closed.")
