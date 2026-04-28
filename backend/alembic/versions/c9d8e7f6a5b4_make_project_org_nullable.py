"""Make projects.organization_id nullable.

Revision ID: c9d8e7f6a5b4
Revises: a2b3c4d5e6f7
Create Date: 2026-04-28 23:30:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "c9d8e7f6a5b4"
down_revision = "a2b3c4d5e6f7"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("projects") as batch_op:
        batch_op.alter_column(
            "organization_id",
            existing_type=sa.Integer(),
            nullable=True,
        )


def downgrade():
    # Projects created without an org cannot exist in the pre-nullable world.
    op.execute("DELETE FROM projects WHERE organization_id IS NULL")
    with op.batch_alter_table("projects") as batch_op:
        batch_op.alter_column(
            "organization_id",
            existing_type=sa.Integer(),
            nullable=False,
        )
