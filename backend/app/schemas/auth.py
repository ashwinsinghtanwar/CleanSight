from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class Register(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    account_type: str = "citizen"            # citizen | municipal
    access_code: Optional[str] = None        # required for municipal accounts


class Login(BaseModel):
    email: EmailStr
    password: str
