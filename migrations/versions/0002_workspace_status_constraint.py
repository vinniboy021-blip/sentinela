"""add check constraint on workspace_items.status

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-23
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE workspace_items
            ADD CONSTRAINT valid_workspace_status
            CHECK (status IN ('open','in_progress','resolved','dismissed'))
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE workspace_items DROP CONSTRAINT IF EXISTS valid_workspace_status")
