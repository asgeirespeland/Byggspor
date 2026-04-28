from __future__ import annotations

import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EnergySource(enum.Enum):
    FILE = "file"
    MANUAL = "manual"


class PriceZone(enum.Enum):
    """Norwegian electricity price zones defined by Statnett."""

    NO1 = "NO1"  # Østlandet (Oslo, Akershus, Østfold, Buskerud, Innlandet)
    NO2 = "NO2"  # Sørlandet (Agder, Rogaland, Vestfold, Telemark)
    NO3 = "NO3"  # Midt-Norge (Trøndelag, Møre og Romsdal)
    NO4 = "NO4"  # Nord-Norge (Nordland, Troms)
    NO5 = "NO5"  # Vestlandet (Vestland)


class Energy(Base):
    __tablename__ = "energies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id"), nullable=False
    )
    source: Mapped[EnergySource | None] = mapped_column(Enum(EnergySource))
    price_zone: Mapped[PriceZone | None] = mapped_column(Enum(PriceZone))
    kwh_used: Mapped[float | None] = mapped_column(Numeric(12, 2))
    grid_emission_factor: Mapped[float | None] = mapped_column(Numeric(10, 6))
    total_co2_kg: Mapped[float | None] = mapped_column(Numeric(12, 4))
    period_start: Mapped[date | None] = mapped_column(Date)
    recorded_date: Mapped[date | None] = mapped_column(Date)
    cost_per_kwh: Mapped[float | None] = mapped_column(Numeric(10, 4))
    confidence_score: Mapped[int | None] = mapped_column(Integer)
    file_path: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="energies")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "project_id": self.project_id,
            "source": self.source.value if self.source else None,
            "price_zone": self.price_zone.value if self.price_zone else None,
            "kwh_used": float(self.kwh_used) if self.kwh_used is not None else None,
            "grid_emission_factor": (
                float(self.grid_emission_factor)
                if self.grid_emission_factor is not None
                else None
            ),
            "total_co2_kg": (
                float(self.total_co2_kg) if self.total_co2_kg is not None else None
            ),
            "confidence_score": self.confidence_score,
            "cost_per_kwh": (
                float(self.cost_per_kwh) if self.cost_per_kwh is not None else None
            ),
            "period_start": (
                self.period_start.isoformat() if self.period_start else None
            ),
            "recorded_date": (
                self.recorded_date.isoformat() if self.recorded_date else None
            ),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
