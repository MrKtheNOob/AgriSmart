from __future__ import annotations

import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from management.models import AnalysisReport, Base, Farm
from management.schemas import (
    AnalysisReportCreate,
    AnalysisReportRead,
    FarmCreate,
    FarmRead,
)
from shared.database_service import DatabaseService


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/management", tags=["management"])
_db_service: DatabaseService | None = None


async def init_management_db(db_service: DatabaseService | None) -> bool:
    global _db_service

    _db_service = db_service
    if _db_service is None:
        logger.warning("Management DB not configured; management routes will remain disabled.")
        return False

    await _db_service.create_tables(Base)

    logger.info("Management tables ensured.")
    return True


async def close_management_db() -> None:
    global _db_service
    _db_service = None
    logger.info("Management DB reference cleared.")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    if _db_service is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Management database is not initialized",
        )

    sessionmaker = _db_service.get_sessionmaker()
    async with sessionmaker() as session:
        yield session


@router.get("/health")
async def management_health():
    return {"status": "healthy" if _db_service else "unavailable"}


@router.get("/farms", response_model=list[FarmRead])
async def list_farms(session: AsyncSession = Depends(get_session)):
    result = await session.scalars(select(Farm).order_by(Farm.created_at.desc()))
    return list(result.all())


@router.post("/farms", response_model=FarmRead, status_code=status.HTTP_201_CREATED)
async def create_farm(payload: FarmCreate, session: AsyncSession = Depends(get_session)):
    farm = Farm(**payload.model_dump())
    session.add(farm)
    await session.commit()
    await session.refresh(farm)
    return farm


@router.get("/farms/{farm_id}", response_model=FarmRead)
async def get_farm(farm_id: int, session: AsyncSession = Depends(get_session)):
    farm = await session.get(Farm, farm_id)
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    return farm


@router.get("/farms/{farm_id}/analysis-reports", response_model=list[AnalysisReportRead])
async def list_farm_reports(farm_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.scalars(
        select(AnalysisReport)
        .where(AnalysisReport.farm_id == farm_id)
        .order_by(AnalysisReport.created_at.desc())
    )
    return list(result.all())


@router.get("/analysis-reports", response_model=list[AnalysisReportRead])
async def list_reports(session: AsyncSession = Depends(get_session)):
    result = await session.scalars(
        select(AnalysisReport).order_by(AnalysisReport.created_at.desc())
    )
    return list(result.all())


@router.post(
    "/analysis-reports",
    response_model=AnalysisReportRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_report(
    payload: AnalysisReportCreate,
    session: AsyncSession = Depends(get_session),
):
    farm = await session.get(Farm, payload.farm_id)
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    report = AnalysisReport(**payload.model_dump())
    session.add(report)
    await session.commit()
    await session.refresh(report)
    return report


@router.get("/analysis-reports/{report_id}", response_model=AnalysisReportRead)
async def get_report(report_id: int, session: AsyncSession = Depends(get_session)):
    report = await session.get(AnalysisReport, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis report not found",
        )
    return report
