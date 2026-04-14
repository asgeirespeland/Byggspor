"""Add price fields to transport, waste and energy models

Revision ID: e24a68a43036
Revises: ae6726008837
Create Date: 2026-04-14 12:23:52.672299

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e24a68a43036"
down_revision: Union[str, Sequence[str], None] = "ae6726008837"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "energies",
        sa.Column("cost_per_kwh", sa.Numeric(precision=10, scale=4), nullable=True),
    )
    op.add_column(
        "project_transports",
        sa.Column("cost_per_km", sa.Numeric(precision=10, scale=2), nullable=True),
    )
    op.add_column(
        "project_waste_items",
        sa.Column("cost_per_ton", sa.Numeric(precision=10, scale=2), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("project_waste_items", "cost_per_ton")
    op.drop_column("project_transports", "cost_per_km")
    op.drop_column("energies", "cost_per_kwh")
