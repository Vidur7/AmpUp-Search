"""create analyses table

Revision ID: create_analyses_table
Revises: create_users_table
Create Date: 2024-05-01

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = "create_analyses_table"
down_revision = "create_users_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analyses",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("anonymous_id", sa.String(), nullable=False, index=True),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("overall_score", sa.Float(), nullable=False),
        sa.Column("crawlability", sqlite.JSON(), nullable=True),
        sa.Column("structured_data", sqlite.JSON(), nullable=True),
        sa.Column("content_structure", sqlite.JSON(), nullable=True),
        sa.Column("eeat", sqlite.JSON(), nullable=True),
        sa.Column("recommendations", sqlite.JSON(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )


def downgrade() -> None:
    op.drop_table("analyses")
