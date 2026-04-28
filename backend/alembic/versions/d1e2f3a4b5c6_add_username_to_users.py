"""Add username column to users.

Revision ID: d1e2f3a4b5c6
Revises: c9d8e7f6a5b4
Create Date: 2026-04-28 23:45:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "d1e2f3a4b5c6"
down_revision = "c9d8e7f6a5b4"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column("username", sa.String(39), nullable=True, unique=True)
        )
        batch_op.create_index("ix_users_username", ["username"], unique=True)


def downgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index("ix_users_username")
        batch_op.drop_column("username")
