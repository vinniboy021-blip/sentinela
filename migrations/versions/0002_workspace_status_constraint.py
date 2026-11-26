"""no-op: colunas label/status já incluídas na migração inicial reescrita

Revision ID: 0002
Revises: 0001_initial
Create Date: 2026-11-23
"""

from alembic import op  # noqa: F401

revision = "0002"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
