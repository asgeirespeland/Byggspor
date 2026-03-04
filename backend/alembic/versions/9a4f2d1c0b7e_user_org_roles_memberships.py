"""user org roles memberships

Revision ID: 9a4f2d1c0b7e
Revises: 28f746489e3c
Create Date: 2026-03-04 12:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9a4f2d1c0b7e"
down_revision: Union[str, Sequence[str], None] = "28f746489e3c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # We add new columns as nullable first to support data migration before enforcing NOT NULL.
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    op.add_column("users", sa.Column("clerk_id", sa.String(length=255), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "is_system_admin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.create_table(
        "organization_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column(
            "role",
            sa.Enum("OWNER", "ADMIN", "MEMBER", "VIEWER", name="orgrole"),
            nullable=False,
            server_default="MEMBER",
        ),
        sa.Column(
            "joined_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "organization_id", name="uq_org_member_user_org"),
    )

    op.create_table(
        "project_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column(
            "role",
            sa.Enum("OWNER", "EDITOR", "VIEWER", name="projectrole"),
            nullable=False,
            server_default="VIEWER",
        ),
        sa.Column(
            "added_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "project_id", name="uq_project_member_user_project"),
    )

    op.execute(
        sa.text(
            """
            INSERT INTO organization_members (user_id, organization_id, role, joined_at)
            SELECT id, organization_id, 'MEMBER', now()
            FROM users
            WHERE organization_id IS NOT NULL
            """
        )
    )

    # Existing rows predate Clerk integration; bootstrap clerk_id from email as a safe placeholder.
    op.execute(
        sa.text(
            """
            UPDATE users
            SET clerk_id = COALESCE(NULLIF(email, ''), CONCAT('legacy-user-', id::text))
            WHERE clerk_id IS NULL
            """
        )
    )

    with op.batch_alter_table("users") as batch_op:
        batch_op.create_unique_constraint("uq_users_clerk_id", ["clerk_id"])
        batch_op.alter_column("clerk_id", existing_type=sa.String(length=255), nullable=False)

    for fk in inspector.get_foreign_keys("users"):
        if fk.get("constrained_columns") == ["organization_id"] and fk.get("name"):
            op.drop_constraint(fk["name"], "users", type_="foreignkey")

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("organization_id")
        batch_op.drop_column("password_hash")


def downgrade() -> None:
    # Downgrade restores legacy user columns and reconstructs a single organization_id per user.
    bind = op.get_bind()

    op.add_column(
        "users",
        sa.Column("organization_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column(
            "password_hash",
            sa.String(length=255),
            nullable=False,
            server_default="MIGRATED_LEGACY",
        ),
    )

    op.execute(
        sa.text(
            """
            UPDATE users AS u
            SET organization_id = m.organization_id
            FROM (
                SELECT DISTINCT ON (user_id) user_id, organization_id
                FROM organization_members
                ORDER BY user_id, joined_at ASC
            ) AS m
            WHERE u.id = m.user_id
            """
        )
    )

    fallback_org_id = bind.execute(
        sa.text(
            """
            INSERT INTO organizations (name, org_type)
            VALUES ('Downgrade Organization', 'COMPANY')
            RETURNING id
            """
        )
    ).scalar_one()

    # Guarantee organization_id is non-null before recreating legacy NOT NULL constraint.
    bind.execute(
        sa.text(
            """
            UPDATE users
            SET organization_id = :fallback_org_id
            WHERE organization_id IS NULL
            """
        ),
        {"fallback_org_id": fallback_org_id},
    )

    with op.batch_alter_table("users") as batch_op:
        batch_op.create_foreign_key(
            "users_organization_id_fkey",
            "organizations",
            ["organization_id"],
            ["id"],
        )
        batch_op.alter_column("organization_id", existing_type=sa.Integer(), nullable=False)
        batch_op.drop_constraint("uq_users_clerk_id", type_="unique")
        batch_op.drop_column("clerk_id")
        batch_op.drop_column("is_system_admin")

    op.drop_table("project_members")
    op.drop_table("organization_members")

    op.execute("DROP TYPE IF EXISTS projectrole")
    op.execute("DROP TYPE IF EXISTS orgrole")
