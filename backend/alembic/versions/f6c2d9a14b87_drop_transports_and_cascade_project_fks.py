"""drop transports and cascade project FKs

Revision ID: f6c2d9a14b87
Revises: e5f6a7b8c9d0
Create Date: 2026-04-28 21:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op


revision: str = "f6c2d9a14b87"
down_revision: Union[str, Sequence[str], None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_CASCADE_TABLES = (
    "project_materials",
    "project_transports",
    "project_waste_items",
    "energies",
    "generated_invoices",
)


def _fk_name(table: str) -> str:
    return f"{table}_project_id_fkey"


def upgrade() -> None:
    op.drop_table("transports")

    for table in _CASCADE_TABLES:
        op.drop_constraint(_fk_name(table), table, type_="foreignkey")
        op.create_foreign_key(
            _fk_name(table),
            table,
            "projects",
            ["project_id"],
            ["id"],
            ondelete="CASCADE",
        )


def downgrade() -> None:
    for table in _CASCADE_TABLES:
        op.drop_constraint(_fk_name(table), table, type_="foreignkey")
        op.create_foreign_key(
            _fk_name(table),
            table,
            "projects",
            ["project_id"],
            ["id"],
        )

    op.create_table(
        "transports",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column(
            "source",
            sa.Enum("FILE", "MANUAL", name="transportsource"),
            nullable=True,
        ),
        sa.Column("vehicle_type", sa.String(length=100), nullable=True),
        sa.Column("vehicle_make", sa.String(length=100), nullable=True),
        sa.Column("vehicle_model", sa.String(length=100), nullable=True),
        sa.Column("distance_km", sa.Numeric(10, 2), nullable=True),
        sa.Column("emission_factor_kg_per_km", sa.Numeric(10, 6), nullable=True),
        sa.Column("total_co2_kg", sa.Numeric(12, 4), nullable=True),
        sa.Column("confidence_score", sa.Integer(), nullable=True),
        sa.Column("file_path", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
    )
