"""add performance indexes for observation lookup

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-26
"""

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_observations_ext_lookup",
        "observations",
        ["investigation_id", "connector_id", "external_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_observations_ext_lookup", table_name="observations")
