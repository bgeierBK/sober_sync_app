"""empty message

Revision ID: a809e2596dd7
Revises: fb1e1445db58
Create Date: 2025-02-20 10:42:01.208363

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a809e2596dd7'
down_revision = 'fb1e1445db58'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users_table', schema=None) as batch_op:
        batch_op.add_column(sa.Column('photo_url', sa.String(length=255), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users_table', schema=None) as batch_op:
        batch_op.drop_column('photo_url')

    # ### end Alembic commands ###
