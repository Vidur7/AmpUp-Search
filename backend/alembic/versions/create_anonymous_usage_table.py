"""create anonymous_usage table

Revision ID: create_anonymous_usage_table
Revises: create_analyses_table
Create Date: 2024-05-01

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "create_anonymous_usage_table"
down_revision = "create_analyses_table"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "anonymous_usage",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("anonymous_id", sa.String(), nullable=False, unique=True),
        sa.Column("analysis_count", sa.Integer(), default=0),
        sa.Column("full_views_used", sa.Integer(), default=0),
        sa.Column("is_premium", sa.Boolean(), default=False),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )
    op.create_index(
        "idx_anonymous_usage_anonymous_id", "anonymous_usage", ["anonymous_id"]
    )


def downgrade() -> None:
    op.drop_index("idx_anonymous_usage_anonymous_id", "anonymous_usage")
    op.drop_table("anonymous_usage")
