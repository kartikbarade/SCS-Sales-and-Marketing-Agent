
from app.db.database import Base, engine
from app.models import Lead, Customer

Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")
