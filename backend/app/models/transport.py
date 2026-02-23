from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TransportSource(enum.Enum):
    FILE = "file"
    MANUAL = "manual"


class Transport(Base):
    __tablename__ = "transports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False
    )
    source: Mapped[TransportSource | None] = mapped_column(Enum(TransportSource))
    vehicle_type: Mapped[str | None] = mapped_column(String(100))
    vehicle_make: Mapped[str | None] = mapped_column(String(100))
    vehicle_model: Mapped[str | None] = mapped_column(String(100))
    distance_km: Mapped[float | None] = mapped_column(Numeric(10, 2))
    emission_factor_kg_per_km: Mapped[float | None] = mapped_column(Numeric(10, 6))
    total_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    confidence_score: Mapped[int | None] = mapped_column(Integer)
    file_path: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="transports")
