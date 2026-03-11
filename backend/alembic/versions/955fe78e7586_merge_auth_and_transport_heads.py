"""merge auth and transport heads

Revision ID: 955fe78e7586
Revises: b3e7a9f12d45, d368b28568dc
Create Date: 2026-03-07 22:00:36.847459

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '955fe78e7586'
down_revision: Union[str, Sequence[str], None] = ('b3e7a9f12d45', 'd368b28568dc')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
