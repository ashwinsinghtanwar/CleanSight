from sqlalchemy import Column,Integer,String,DateTime
from datetime import datetime,timezone
from app.database.database import Base
class User(Base):
 __tablename__="users"
 id=Column(Integer,primary_key=True,index=True); full_name=Column(String(120)); email=Column(String(255),unique=True,index=True); hashed_password=Column(String(255)); role=Column(String(20),default="citizen"); created_at=Column(DateTime,default=lambda:datetime.now(timezone.utc))
