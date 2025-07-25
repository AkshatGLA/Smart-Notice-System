from flask import request, jsonify
from bson import ObjectId
import datetime
from models.notice_model import Notice
from models.user_model import User
from middleware.auth import token_required
import traceback

def init_notice_routes(app):
    @app.route("/api/notices", methods=["GET"])
    @token_required
    def get_notices(current_user):
        try:
            notices = Notice.objects().order_by('-createdAt')
            user_map = {str(user.id): user for user in User.objects.only('id', 'name', 'email')}
            
            notices_data = []
            for notice in notices:
                creator = user_map.get(notice.createdBy)
                notices_data.append({
                    "id": str(notice.id),
                    "title": notice.title,
                    "content": notice.content,
                    "category": notice.category,
                    "status": notice.status,
                    "publishAt": notice.publishAt.isoformat() if notice.publishAt else None,
                    "createdAt": notice.createdAt.isoformat(),
                    "updatedAt": notice.updatedAt.isoformat(),
                    "createdBy": {
                        "id": notice.createdBy,
                        "name": creator.name if creator else "Unknown",
                        "email": creator.email if creator else ""
                    },
                    "targets": notice.targets,
                    "deliveryChannels": notice.deliveryChannels,
                    "readCount": len(notice.readBy),
                    "readBy": notice.readBy
                })
                
            return jsonify(notices_data), 200
            
        except Exception as e:
            print(f"Error fetching notices: {str(e)}")
            traceback.print_exc()
            return jsonify({"error": "Failed to fetch notices"}), 500

    # Add all other notice routes similarly...
    # (create_notice, mark_as_read, get_notice_analytics, etc.)