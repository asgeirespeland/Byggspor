"""rename quantity_tons to quantity and add unit to project_waste_items

Revision ID: f5b8d2e7a319
Revises: e2f3a4b5c6d7
Create Date: 2026-04-16

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "f5b8d2e7a319"
down_revision = "e2f3a4b5c6d7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "project_waste_items",
        "quantity_tons",
        new_column_name="quantity",
    )
    op.add_column(
        "project_waste_items",
        sa.Column("unit", sa.String(10), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("project_waste_items", "unit")
    op.alter_column(
        "project_waste_items",
        "quantity",
        new_column_name="quantity_tons",
    )
