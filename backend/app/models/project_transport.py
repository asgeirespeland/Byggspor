"""A transport trip recorded for a specific project, with source provenance."""

from __future__ import annotations

import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TransportSourceType(enum.Enum):
    ABAX_XML = "abax_xml"
    MANUAL = "manual"


class ProjectTransport(Base):
    __tablename__ = "project_transports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False
    )
    vehicle_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("vehicles.id"))
    source_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("transport_reports.id")
    )
    source_type: Mapped[TransportSourceType | None] = mapped_column(
        Enum(TransportSourceType)
    )
    driver_name: Mapped[str | None] = mapped_column(String(255))
    department: Mapped[str | None] = mapped_column(String(255))
    trip_date: Mapped[date | None] = mapped_column(Date)
    start_address: Mapped[str | None] = mapped_column(String(500))
    end_address: Mapped[str | None] = mapped_column(String(500))
    distance_km: Mapped[float | None] = mapped_column(Numeric(10, 2))
    duration_minutes: Mapped[float | None] = mapped_column(Numeric(10, 2))
    toll_kr: Mapped[float | None] = mapped_column(Numeric(10, 2))
    ferry_kr: Mapped[float | None] = mapped_column(Numeric(10, 2))
    parking_kr: Mapped[float | None] = mapped_column(Numeric(10, 2))
    total_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    confidence_score: Mapped[int | None] = mapped_column(Integer)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="project_transports")
    vehicle: Mapped["Vehicle | None"] = relationship(
        back_populates="project_transports"
    )
    source_report: Mapped["TransportReport | None"] = relationship()
