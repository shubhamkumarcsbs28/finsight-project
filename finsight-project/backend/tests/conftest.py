import pytest
from app.database import Base, engine


@pytest.fixture(autouse=True)
def setup_test_database():
    """Recreate all tables clean before each test execution."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
