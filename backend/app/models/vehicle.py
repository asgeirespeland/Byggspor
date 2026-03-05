"""Shared vehicle catalog — one record per unique registration number.

Acts as a cache for vehicle emission data. Not owned by any project or org.
"""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VehicleSource(enum.Enum):
    VEGVESEN_API = "vegvesen_api"
    MANUAL = "manual"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    registration_number: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )
    vehicle_type: Mapped[str | None] = mapped_column(String(100))
    make: Mapped[str | None] = mapped_column(String(100))
    model: Mapped[str | None] = mapped_column(String(100))
    fuel_type: Mapped[str | None] = mapped_column(String(50))
    co2_per_km: Mapped[float | None] = mapped_column(Numeric(10, 6))
    source: Mapped[VehicleSource | None] = mapped_column(Enum(VehicleSource))
    cached_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    project_transports: Mapped[list["ProjectTransport"]] = relationship(
        back_populates="vehicle"
    )
