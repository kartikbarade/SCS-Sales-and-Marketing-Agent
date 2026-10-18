from app.db.database import Base, engine
from app.models.lead import Lead

Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")