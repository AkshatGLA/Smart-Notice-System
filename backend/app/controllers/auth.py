from flask import request, jsonify
import traceback
import jwt
import datetime
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from models.user_model import User
from app import app

def init_auth_routes(app):
    @app.route("/api/auth/signup", methods=["POST"])
    def signup():
        try:
            data = request.json
            
            if User.objects(email=data['email']).first():
                return jsonify({"error": "Email already exists"}), 400
                
            hashed_password = generate_password_hash(data['password'])
            
            user = User(
                name=data['name'],
                email=data['email'],
                password=hashed_password
            )
            user.save()
            
            return jsonify({"message": "User created successfully"}), 201
            
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    @app.route("/api/auth/refresh", methods=["POST"])
    def refresh():
        try:
            refresh_token = request.json.get('refreshToken')
            if not refresh_token:
                return jsonify({"error": "Refresh token required"}), 400
                
            data = jwt.decode(refresh_token, app.config['SECRET_KEY'], algorithms=["HS256"])
            user = User.objects(id=ObjectId(data['user_id'])).first()
            
            if not user:
                return jsonify({"error": "Invalid user"}), 401
                
            new_access_token = jwt.encode({
                'user_id': str(user.id),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
            }, app.config['SECRET_KEY'])
            
            return jsonify({
                "accessToken": new_access_token,
                "user": {
                    "id": str(user.id),
                    "name": user.name,
                    "email": user.email,
                    "role": user.role
                }
            }), 200
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Refresh token expired"}), 401
        except Exception as e:
            print(f"Refresh error: {str(e)}")
            return jsonify({"error": "Token refresh failed"}), 400

    @app.route("/api/auth/login", methods=["POST"])
    def login():
        try:
            data = request.json
            user = User.objects(email=data['email']).first()
            
            if not user or not check_password_hash(user.password, data['password']):
                return jsonify({"error": "Invalid credentials"}), 401
                
            access_token = jwt.encode({
                'user_id': str(user.id),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
            }, app.config['SECRET_KEY'])
            
            refresh_token = jwt.encode({
                'user_id': str(user.id),
                'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
            }, app.config['SECRET_KEY'])
            
            return jsonify({
                "accessToken": access_token,
                "refreshToken": refresh_token,
                "user": {
                    "id": str(user.id),
                    "name": user.name,
                    "email": user.email,
                    "role": user.role
                }
            }), 200
            
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500