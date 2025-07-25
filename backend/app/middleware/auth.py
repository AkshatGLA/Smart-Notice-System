from functools import wraps
from flask import request, jsonify
import jwt
from bson import ObjectId
from app import app
from models.user_model import User

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        auth_header = request.headers.get('Authorization', '')
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]
        
        if not token:
            return jsonify({'message': 'Token is missing or malformed!'}), 401
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.objects(id=ObjectId(data['user_id'])).first()
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
            kwargs['current_user'] = current_user
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except Exception as e:
            print(f"Token validation error: {str(e)}")
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(*args, **kwargs)
        
    return decorated