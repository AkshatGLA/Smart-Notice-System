from mongoengine import Document, StringField, EmailField, DateTimeField
import datetime

class User(Document):
    name = StringField(required=True)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)
    role = StringField(choices=["admin", "user"], default="user")
    createdAt = DateTimeField(default=datetime.datetime.utcnow)
    meta = {"collection": "users"}