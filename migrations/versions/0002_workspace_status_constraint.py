"""add label/status columns and check constraints to workspace_items

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-23
"""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add columns missing from the initial migration
    op.add_column("workspace_items", sa.Column("label", sa.String(250), nullable=False, server_default=""))
    op.add_column("workspace_items", sa.Column("status", sa.String(30), nullable=False, server_default="open"))
    op.alter_column("workspace_items", "label", server_default=None)
    op.alter_column("workspace_items", "status", server_default=None)
    # Enforce enum-like constraints at the DB level
    op.execute(
        """
        ALTER TABLE workspace_items
            ADD CONSTRAINT valid_kind
            CHECK (kind IN ('hypothesis','observation','task'))
        """
    )
    op.execute(
        """
        ALTER TABLE workspace_items
            ADD CONSTRAINT valid_workspace_status
            CHECK (status IN ('open','in_progress','resolved','dismissed'))
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE workspace_items DROP CONSTRAINT IF EXISTS valid_workspace_status")
    op.execute("ALTER TABLE workspace_items DROP CONSTRAINT IF EXISTS valid_kind")
    op.drop_column("workspace_items", "status")
    op.drop_column("workspace_items", "label")
