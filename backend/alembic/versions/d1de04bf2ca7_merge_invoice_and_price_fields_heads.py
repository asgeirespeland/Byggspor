"""merge_invoice_and_price_fields_heads

Revision ID: d1de04bf2ca7
Revises: e24a68a43036, f1a3c8e2b045
Create Date: 2026-04-16 12:44:38.685595

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1de04bf2ca7'
down_revision: Union[str, Sequence[str], None] = ('e24a68a43036', 'f1a3c8e2b045')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
