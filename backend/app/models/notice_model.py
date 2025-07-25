from mongoengine import Document, StringField, DictField, ListField, DateTimeField
import datetime

class Notice(Document):
    title = StringField(required=True)
    content = StringField(required=True)
    category = StringField(required=True, choices=["Academic", "Event", "General"])
    status = StringField(default="draft", choices=["draft", "published", "scheduled"])
    publishAt = DateTimeField()
    createdAt = DateTimeField(default=datetime.datetime.now)
    updatedAt = DateTimeField(default=datetime.datetime.now)  
    createdBy = StringField(required=True)
    targets = DictField(default={})
    deliveryChannels = ListField(StringField(), default=['web'])
    readBy = ListField(DictField(), default=[])
    meta = {
        'collection': 'notices',
        'indexes': [
            '-createdAt',
            'category',
            'status'
        ]
    }