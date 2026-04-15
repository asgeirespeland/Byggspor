"""add supplier_name to waste_invoices

Revision ID: c4a1e7f23b91
Revises: ae6726008837
Create Date: 2026-04-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c4a1e7f23b91"
down_revision: Union[str, Sequence[str], None] = "ae6726008837"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "waste_invoices",
        sa.Column("supplier_name", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("waste_invoices", "supplier_name")
