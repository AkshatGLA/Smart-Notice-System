from flask import Flask, request, jsonify
from flask_cors import CORS
from mongoengine import connect, Document, EmbeddedDocument, EmbeddedDocumentField, StringField, DictField, ListField, DateTimeField, EmailField, IntField, BooleanField
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv
import traceback
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import re
import json
from werkzeug.utils import secure_filename,send_file
import pandas as pd
import random
import string
from io import BytesIO
from datetime import timedelta
# Add this import near the top with your other imports
from utils.email_send_function import send_bulk_email
load_dotenv()

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000","*"],  # Adjust for your frontend URL
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Authorization", "Content-Type"],
        "supports_credentials": True
    }
})

# CORS(app)
# app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6k')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-super-secret-key-that-nobody-can-guess')
# Database Connection
MONGO_URI = os.environ.get('MONGO_URI')

try:
    connect(
        db="smart-notice",
        host=MONGO_URI
    )
    print("✅ MongoDB Connected Successfully!")
except ConnectionFailure as e:
    print("❌ MongoDB Connection Failed:", str(e))


class User(Document):
    name = StringField(required=True)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)
    role = StringField(choices=["admin", "user"], default="user")
    createdAt = DateTimeField(default=datetime.datetime.utcnow)
    meta = {"collection": "users"}

# Update the Notice model
class Notice(Document):
    title = StringField(required=True)
    subject = StringField()
    content = StringField(required=True)
    notice_type = StringField()
    departments = ListField(StringField(), default=[])

    program_course = ListField(StringField(), default=[]) # Changed
    year = ListField(StringField(), default=[])           # Changed
    section = ListField(StringField(), default=[])   

    # program_course = StringField()
    specialization = StringField(default="core")
    # year = StringField()
    # section = StringField()
    recipient_emails = ListField(StringField(), default=[])
    priority = StringField(choices=["Normal", "Urgent", "Highly Urgent"], default="Normal")
    status = StringField(default="draft", choices=["draft", "published", "scheduled"])
    send_options = DictField(default={"email": False, "web": True})
    schedule_date = BooleanField(default=False)
    schedule_time = BooleanField(default=False)
    date = StringField()
    time = StringField()
    from_field = StringField()  # Use from_field to avoid Python's 'from' keyword
    publish_at = DateTimeField()
    created_at = DateTimeField(default=datetime.datetime.now)
    updated_at = DateTimeField(default=datetime.datetime.now)
    created_by = StringField(required=True)
    attachments = ListField(StringField(), default=[])
    reads = ListField(DictField(), default=[])
    read_count = IntField(default=0)
    
    meta = {
        'collection': 'notices',
        'indexes': [
            '-created_at',
            'notice_type',
            'status',
            'departments',
            'year',
            'reads.user_id',
            'priority'
        ]
    }


class Student(Document):
    # Identification
    class_roll_no = StringField()
    univ_roll_no = StringField(required=True, unique=True)
    course = StringField(required=True)
    branch = StringField(required=True)
    year = StringField()
    section = StringField()
    
    # Personal Information
    name = StringField(required=True)
    name_hindi = StringField()
    father_name = StringField()
    mother_name = StringField()
    dob = DateTimeField()
    gender = StringField()
    address = StringField()
    
    # Contact Information
    student_mobile = StringField()
    student_alt_contact = StringField()
    father_mobile = StringField()
    father_alt_contact = StringField()
    mother_contact = StringField()
    official_email = EmailField()
    
    # Academic History
    file_no = StringField()
    high_school = DictField()
    intermediate = DictField()
    graduation = DictField()
    
    # Additional Information
    lib_code = StringField()
    last_medium = StringField()
    admission_office = StringField()
    target_company = StringField()
    hobbies = StringField()
    
    # Ratings
    ratings = DictField()
    
    # System Fields
    email = EmailField(unique=True, sparse=True)
    password = StringField(required=True)
    raw_password = StringField()
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    
    meta = {
        'collection': 'students',
        'strict': False,  # <-- ADD THIS LINE
        'indexes': [
            'univ_roll_no',
            'course',
            'branch',
            'year',
            'section',
            'email',
            'official_email'
        ]
    }

class Teacher(Document):
    employee_id = StringField(required=True, unique=True)
    name = StringField(required=True)
    department = StringField(required=True)
    post = StringField()
    specialization = StringField()
    mobile = StringField()
    official_email = EmailField(unique=True, sparse=True)
    
    # System Fields
    email = EmailField(unique=True, sparse=True) # For login, if different from official
    password = StringField(required=True)
    raw_password = StringField()
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    
    meta = {
        'collection': 'teachers',
        'indexes': [
            'employee_id',
            'department',
            'official_email'
        ]
    }


# Add these new models to app.py
class Course(EmbeddedDocument):
    name = StringField(required=True)
    code = StringField(required=True, unique=True)

class Department(Document):
    name = StringField(required=True, unique=True)
    code = StringField(required=True, unique=True)
    courses = ListField(EmbeddedDocumentField(Course))

    meta = {'collection': 'departments'}

def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.role not in roles:
                return jsonify({'message': 'Unauthorized access!'}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

# Auth Middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # More flexible header parsing
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
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except Exception as e:
            print(f"Token validation error: {str(e)}")
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
        
    return decorated
# Routes
@app.route("/")
def hello():
    return "Smart Notice API - Ready for development"

# Auth Routes
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
            
        # Generate both access and refresh tokens
        access_token = jwt.encode({
            'user_id': str(user.id),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)  # Shorter lifespan
        }, app.config['SECRET_KEY'])
        
        refresh_token = jwt.encode({
            'user_id': str(user.id),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)  # Longer lifespan
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

# Get All Notices - Updated
@app.route("/api/notices", methods=["GET"])
@token_required
@role_required(['admin','user'])
def get_notices(current_user):
    try:
        notices = Notice.objects().order_by('-created_at')
        user_map = {str(user.id): user for user in User.objects.only('id', 'name', 'email')}
        
        notices_data = []
        for notice in notices:
            creator = user_map.get(notice.created_by)
            notices_data.append({
                "id": str(notice.id),
                "title": notice.title,
                "subject": notice.subject,
                "content": notice.content,  # HTML from RTE
                "noticeType": notice.notice_type,
                "departments": notice.departments,
                "programCourse": notice.program_course,
                "specialization": notice.specialization,
                "year": notice.year,
                "section": notice.section,
                "priority": notice.priority,
                "status": notice.status,
                "publishAt": notice.publish_at.isoformat() if notice.publish_at else None,
                "createdAt": notice.created_at.isoformat(),
                "readCount": notice.read_count,
                "createdBy": {
                    "id": notice.created_by,
                    "name": creator.name if creator else "Unknown",
                    "email": creator.email if creator else ""
                }
            })
            
        return jsonify(notices_data), 200
        
    except Exception as e:
        print(f"Error fetching notices: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Add these new routes to app.py
@app.route('/api/years', methods=['GET'])
@token_required
def get_years(current_user):
    try:
        # Use .getlist() to receive multiple values for the same key
        department_names = request.args.getlist('department')
        course_names = request.args.getlist('course')
        
        query = {}
        if department_names: query['branch__in'] = department_names
        if course_names: query['course__in'] = course_names
        
        # Get distinct years based on the combined query
        years = Student.objects(**query).distinct('year')
        sorted_years = sorted([y for y in years if y])
        return jsonify(sorted_years), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sections', methods=['GET'])
@token_required
def get_sections(current_user):
    try:
        department_names = request.args.getlist('department')
        course_names = request.args.getlist('course')
        years = request.args.getlist('year')
        
        query = {}
        if department_names: query['branch__in'] = department_names
        if course_names: query['course__in'] = course_names
        if years: query['year__in'] = years
        
        sections = Student.objects(**query).distinct('section')
        sorted_sections = sorted([s for s in sections if s])
        return jsonify(sorted_sections), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/teachers/upload-details", methods=["POST"])
@token_required
@role_required(['admin'])
def upload_teacher_details(current_user):
    COLUMN_MAP = {
        'employee_id': ['employee id', 'employee_id', 'emp_id'],
        'name': ['name', 'teacher name', 'teacher_name'],
        'post': ['post', 'designation'],
        'specialization': ['specialization', 'speciality'],
        'mobile': ['mobile', 'contact no', 'phone'],
        'official_email': ['email', 'official email', 'official_email']
    }

    try:
        department = request.form.get('department')
        file = request.files.get('file')

        if not all([department, file]):
            return jsonify({"error": "Department and file are required."}), 400

        print("✅ Teacher file received. Attempting to read...")
        try:
            df = pd.read_excel(file) if file.filename.lower().endswith(('.xlsx', '.xls')) else pd.read_csv(file, encoding='utf-8', skipinitialspace=True)
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": f"Could not read the file. Details: {str(e)}"}), 400

        df.columns = [col.strip().lower() for col in df.columns]
        df = df.fillna('')
        print(f"✅ File read successfully. Found {len(df)} rows.")

        teachers_to_create = []
        conflicts = [] # <-- MODIFIED: Will hold full data for conflicting teachers
        errors = []    # <-- For actual processing errors

        for index, row in df.iterrows():
            employee_id = str(get_column_value(row, COLUMN_MAP, 'employee_id'))
            if not employee_id:
                errors.append(f"Row {index + 2}: Skipped. Missing Employee ID.")
                continue

            # --- MODIFIED LOGIC: CHECK FOR CONFLICTS ---
            if Teacher.objects(employee_id=employee_id).first():
                # This is a conflict. Capture all data from the file row.
                conflict_data = {
                    'employee_id': employee_id,
                    'name': get_column_value(row, COLUMN_MAP, 'name'),
                    'post': get_column_value(row, COLUMN_MAP, 'post'),
                    'specialization': get_column_value(row, COLUMN_MAP, 'specialization'),
                    'mobile': get_column_value(row, COLUMN_MAP, 'mobile'),
                    'official_email': get_column_value(row, COLUMN_MAP, 'official_email'),
                    'department': department # Department comes from the form
                }
                conflicts.append(conflict_data)
                continue

            raw_password = generate_password()
            official_email = get_column_value(row, COLUMN_MAP, 'official_email')
            login_email = official_email if official_email else f"{employee_id}@university.edu"

            teacher = Teacher(
                employee_id=employee_id,
                name=get_column_value(row, COLUMN_MAP, 'name'),
                department=department,
                post=get_column_value(row, COLUMN_MAP, 'post'),
                specialization=get_column_value(row, COLUMN_MAP, 'specialization'),
                mobile=get_column_value(row, COLUMN_MAP, 'mobile'),
                official_email=official_email,
                email=login_email.lower(),
                password=generate_password_hash(raw_password),
                raw_password=raw_password
            )
            teachers_to_create.append(teacher)

        if teachers_to_create:
            Teacher.objects.insert(teachers_to_create)

        message = f"Process complete. Successfully created {len(teachers_to_create)} new teachers."
        if not teachers_to_create and not conflicts and not errors:
             message = "No new teachers were added. The file may have been empty or contained only existing records."

        # --- MODIFIED RESPONSE ---
        return jsonify({
            "message": message,
            "conflicts": conflicts, # Send back detailed conflict info
            "errors": errors
        }), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"An unexpected server error occurred: {str(e)}"}), 500

@app.route("/api/teachers/batch-update", methods=["POST"])
@token_required
@role_required(['admin'])
def batch_update_teachers(current_user):
    try:
        teachers_to_update = request.json
        if not isinstance(teachers_to_update, list):
            return jsonify({"error": "Invalid payload. Expected a list of teacher objects."}), 400
            
        updated_count = 0
        failed_ids = []

        for teacher_data in teachers_to_update:
            employee_id = teacher_data.get('employee_id')
            if not employee_id:
                continue

            teacher = Teacher.objects(employee_id=employee_id).first()
            if teacher:
                teacher.name = teacher_data.get('name', teacher.name)
                teacher.department = teacher_data.get('department', teacher.department)
                teacher.post = teacher_data.get('post', teacher.post)
                teacher.specialization = teacher_data.get('specialization', teacher.specialization)
                teacher.mobile = teacher_data.get('mobile', teacher.mobile)
                
                official_email = teacher_data.get('official_email', teacher.official_email).lower()
                if official_email:
                    teacher.official_email = official_email
                    teacher.email = official_email
                
                teacher.save()
                updated_count += 1
            else:
                failed_ids.append(employee_id)
        
        message = f"Successfully updated {updated_count} teacher(s)."
        if failed_ids:
            message += f" Failed to find teachers with IDs: {', '.join(failed_ids)}."
            
        return jsonify({"message": message}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"An unexpected server error occurred: {str(e)}"}), 500
    
@app.route("/api/students/update-manual/<univ_roll_no>", methods=["PUT"])
@token_required
@role_required(['admin'])
def update_student_manual(current_user, univ_roll_no):
    try:
        data = request.json
        student = Student.objects(univ_roll_no=univ_roll_no).first()
        if not student:
            return jsonify({"error": "Student not found."}), 404
        
        student.branch = data.get('department', student.branch)
        student.course = data.get('course', student.course)
        student.year = data.get('year', student.year)
        student.section = data.get('section', student.section)
        student.name = data.get('name', student.name)
        student.father_name = data.get('father_name', student.father_name)
        student.father_mobile = data.get('father_mobile', student.father_mobile)
        student.official_email = data.get('official_email', student.official_email).lower()
        student.email = data.get('official_email', student.email).lower()
        
        student.save()
        return jsonify({"message": f"Successfully updated student '{student.name}'."}), 200
    except Exception as e:
        return jsonify({"error": f"An unexpected server error: {str(e)}"}), 500
    
@app.route("/api/teachers/update-manual/<employee_id>", methods=["PUT"])
@token_required
@role_required(['admin'])
def update_teacher_manual(current_user, employee_id):
    try:
        data = request.json
        teacher = Teacher.objects(employee_id=employee_id).first()
        if not teacher:
            return jsonify({"error": "Teacher not found."}), 404
            
        teacher.department = data.get('department', teacher.department)
        teacher.name = data.get('name', teacher.name)
        teacher.post = data.get('post', teacher.post)
        teacher.specialization = data.get('specialization', teacher.specialization)
        teacher.mobile = data.get('mobile', teacher.mobile)
        teacher.official_email = data.get('official_email', teacher.official_email).lower()
        teacher.email = data.get('official_email', teacher.email).lower()

        teacher.save()
        return jsonify({"message": f"Successfully updated teacher '{teacher.name}'."}), 200
    except Exception as e:
        return jsonify({"error": f"An unexpected server error: {str(e)}"}), 500

@app.route("/api/teachers/add-manual", methods=["POST"])
@token_required
@role_required(['admin'])
def add_teacher_manual(current_user):
    try:
        data = request.json
        employee_id = data.get('employee_id')
        
        existing_teacher = Teacher.objects(employee_id=employee_id).first()
        if existing_teacher:
            teacher_data = json.loads(existing_teacher.to_json())
            return jsonify({
                "error": f"Teacher with Employee ID '{employee_id}' already exists.",
                "existing_data": teacher_data
            }), 409

        raw_password = generate_password()
        teacher = Teacher(
            department=data.get('department'),
            employee_id=employee_id,
            name=data.get('name'),
            post=data.get('post'),
            specialization=data.get('specialization'),
            mobile=data.get('mobile'),
            official_email=data.get('official_email', '').lower(),
            email=data.get('official_email', '').lower(),
            password=generate_password_hash(raw_password),
            raw_password=raw_password
        )
        teacher.save()
        return jsonify({"message": f"Successfully created teacher '{data.get('name')}'."}), 201
    except Exception as e:
        return jsonify({"error": f"An unexpected server error: {str(e)}"}), 500
    
@app.route("/api/notices", methods=["POST"])
@token_required
def create_notice(current_user):
    attachment_paths = []
    try:
        form_data = request.form
        files = request.files.getlist('attachments')

        # --- Handle Attachments ---
        attachment_filenames = []
        if files:
            if not os.path.exists(app.config['UPLOAD_FOLDER']):
                os.makedirs(app.config['UPLOAD_FOLDER'])
            for file in files:
                if file.filename != '':
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    attachment_paths.append(file_path)
                    attachment_filenames.append(filename)

        # --- Parse Targeting Criteria & Send Options ---
        target_departments = json.loads(form_data.get('departments', '[]'))
        target_courses = json.loads(form_data.get('courses', '[]'))
        target_years = json.loads(form_data.get('years', '[]'))
        target_sections = json.loads(form_data.get('sections', '[]'))
        send_options = json.loads(form_data.get('send_options', '{"email": false, "web": true}'))
        
        # --- Build Recipient Email List ---
        recipient_emails = set() # Use a set to automatically handle duplicates

        # CORRECTED: Add manually entered emails from the form first
        manual_emails = json.loads(form_data.get('recipient_emails', '[]'))
        for email in manual_emails:
            if email.strip():
                recipient_emails.add(email.strip())

        # Build query for students based on dropdown selections
        student_query = {}
        if target_departments: student_query['branch__in'] = target_departments
        if target_courses: student_query['course__in'] = target_courses
        if target_years: student_query['year__in'] = target_years
        if target_sections: student_query['section__in'] = target_sections
        
        # Find matching students and add their emails
        if student_query:
            for student in Student.objects(**student_query):
                if student.official_email:
                    recipient_emails.add(student.official_email)

        # Find matching teachers and add their emails
        if target_departments:
            for teacher in Teacher.objects(department__in=target_departments):
                if teacher.official_email:
                    recipient_emails.add(teacher.official_email)

        # --- Create and Save the Notice ---
        notice = Notice(
            title=form_data.get('title'),
            subject=form_data.get('subject', ''),
            content=form_data.get('content'),
            departments=target_departments,
            program_course=target_courses,
            year=target_years,
            section=target_sections,
            recipient_emails=list(recipient_emails),
            priority=form_data.get('priority', 'Normal'),
            send_options=send_options,
            status=form_data.get('status', 'draft'),
            created_by=str(current_user.id),
            attachments=attachment_filenames
        )
        notice.save()
        
        # --- Send Email with Attachments ---
        if notice.status == 'published' and send_options.get('email') and recipient_emails:
            print(f"✅ Preparing to send email to {len(recipient_emails)} recipients with {len(attachment_paths)} attachments.")
            send_bulk_email(
                recipient_emails=list(recipient_emails),
                subject=notice.subject or notice.title,
                body=notice.content,
                attachments=attachment_paths
            )
        elif notice.status == 'published':
             print(f"✅ Notice '{notice.title}' published, but email option was not selected or no recipients were found.")

        return jsonify({"message": "Notice created successfully", "noticeId": str(notice.id)}), 201
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        # --- Cleanup: Remove temporary files ---
        if attachment_paths:
            print("Cleaning up temporary attachment files...")
            for path in attachment_paths:
                try:
                    if os.path.exists(path):
                        os.remove(path)
                        print(f"Removed temporary file: {path}")
                except Exception as e:
                    print(f"Error removing temporary file {path}: {e}")

@app.route('/api/departments', methods=['GET'])
@token_required
def get_departments(current_user):
    try:
        departments = Department.objects.only('name', 'code').order_by('name')
        return jsonify([{"name": d.name, "code": d.code} for d in departments]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/departments/<code>/courses', methods=['GET'])
@token_required
def get_courses_by_department(current_user, code):
    try:
        department = Department.objects(code=code).first()
        if not department:
            return jsonify({"error": "Department not found."}), 404
        
        courses = sorted(department.courses, key=lambda c: c.name)
        return jsonify([{"name": c.name, "code": c.code} for c in courses]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

# Add this new route to app.py
@app.route('/api/courses-by-departments', methods=['POST'])
@token_required
def get_courses_by_departments(current_user):
    try:
        data = request.json
        dept_codes = data.get('departments', [])
        if not dept_codes:
            return jsonify([]), 200

        # Find all departments that match the provided codes
        departments = Department.objects(code__in=dept_codes)
        
        # Use a dictionary to collect unique courses, preventing duplicates
        all_courses = {} 
        for dept in departments:
            for course in dept.courses:
                if course.code not in all_courses:
                    all_courses[course.code] = {"name": course.name, "code": course.code}
        
        # Sort the unique courses by name before sending them back
        sorted_courses = sorted(list(all_courses.values()), key=lambda c: c['name'])
        
        return jsonify(sorted_courses), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/notices/<notice_id>/read", methods=["POST"])
@token_required
def mark_notice_read(current_user, notice_id):
    try:
        notice = Notice.objects(id=ObjectId(notice_id)).first()
        if not notice:
            return jsonify({"error": "Notice not found"}), 404

        user_id = str(current_user.id)
        now = datetime.datetime.utcnow()

        # Check if user already read this notice
        existing_read = next((read for read in notice.reads if read.get('user_id') == user_id), None)

        if existing_read:
            # Update existing read timestamp
            notice.update(
                pull__reads={"user_id": user_id}
            )
            notice.update(
                push__reads={
                    "user_id": user_id,
                    "timestamp": now,
                    "is_first_read": False
                }
            )
            return jsonify({
                "message": "Read timestamp updated",
                "isNewRead": False
            }), 200
        else:
            # Add new read record
            notice.update(
                push__reads={
                    "user_id": user_id,
                    "timestamp": now,
                    "is_first_read": True
                }
            )
            # Increment unique read count
            notice.update(inc__read_count=1)
            return jsonify({
                "message": "First read recorded",
                "isNewRead": True
            }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/notices/<notice_id>/reads", methods=["GET"])
@token_required
@role_required(['admin'])
def get_notice_reads(current_user, notice_id):
    try:
        notice = Notice.objects(id=ObjectId(notice_id)).first()
        if not notice:
            return jsonify({"error": "Notice not found"}), 404

        # Get user details for each read
        user_ids = list({read['user_id'] for read in notice.reads})  # Get unique user IDs
        users = User.objects(id__in=user_ids)
        user_map = {str(user.id): user for user in users}

        # Count reads per user
        read_counts = {}
        for read in notice.reads:
            user_id = read['user_id']
            read_counts[user_id] = read_counts.get(user_id, 0) + 1

        reads_data = []
        for user_id, count in read_counts.items():
            user = user_map.get(user_id)
            reads_data.append({
                "user_id": user_id,
                "user_name": user.name if user else "Unknown",
                "user_email": user.email if user else "",
                "roll_number": getattr(user, 'roll_number', 'null'),  # Add if available
                "department": getattr(user, 'department', 'null'),    # Add if available
                "course": getattr(user, 'course', 'null'),            # Add if available
                "section": getattr(user, 'section', 'null'),          # Add if available
                "read_count": count,
                "last_read": max(
                    [read['timestamp'] for read in notice.reads if read['user_id'] == user_id]
                ).isoformat() if notice.reads else None
            })

        return jsonify({
            "total_reads": len(notice.reads),
            "unique_readers": notice.read_count,
            "reads": reads_data
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route("/api/notices/<notice_id>/analytics", methods=["GET"])
@token_required
@role_required(['admin'])
def get_notice_analytics(current_user, notice_id):
    try:
        notice = Notice.objects(id=ObjectId(notice_id)).first()
        if not notice:
            return jsonify({"error": "Notice not found"}), 404
            
        # Basic analytics based on available fields
        analytics_data = {
            "recipientCount": len(notice.recipient_emails) if notice.recipient_emails else 0,
            "priority": notice.priority,
            "status": notice.status,
            "publishedAt": notice.publishAt.isoformat() if notice.publishAt else None,
            "createdAt": notice.createdAt.isoformat(),
            "attachmentsCount": len(notice.attachments) if notice.attachments else 0
        }
        
        # If you want to add read tracking later, you can add this field to your schema
        # and then include: "readCount": len(notice.readBy) if hasattr(notice, 'readBy') else 0
        
        return jsonify(analytics_data), 200
    except Exception as e:
        print(f"Analytics error: {str(e)}")
        return jsonify({"error": "Failed to fetch analytics"}), 500



@app.route("/api/notices/<notice_id>", methods=["GET"])
@token_required
def get_notice(current_user, notice_id):
    try:
        notice = Notice.objects(id=ObjectId(notice_id)).first()
        if not notice:
            return jsonify({"error": "Notice not found"}), 404
        
        creator = User.objects(id=ObjectId(notice.created_by)).first()
        
        return jsonify({
            "id": str(notice.id),
            "title": notice.title,
            "subject": notice.subject,
            "content": notice.content,  # HTML content from RTE
            "noticeType": notice.notice_type,
            "departments": notice.departments,
            "programCourse": notice.program_course,
            "specialization": notice.specialization,
            "year": notice.year,
            "section": notice.section,
            "recipientEmails": notice.recipient_emails,
            "priority": notice.priority,
            "status": notice.status,
            "sendOptions": notice.send_options,
            "scheduleDate": notice.schedule_date,
            "scheduleTime": notice.schedule_time,
            "date": notice.date,
            "time": notice.time,
            "from": notice.from_field,
            "publishAt": notice.publish_at.isoformat() if notice.publish_at else None,
            "createdAt": notice.created_at.isoformat(),
            "updatedAt": notice.updated_at.isoformat(),
            "readCount": notice.read_count,
            "createdBy": {
                "id": notice.created_by,
                "name": creator.name if creator else "Unknown",
                "email": creator.email if creator else ""
            },
            "attachments": notice.attachments
        }), 200
        
    except Exception as e:
        print(f"Error fetching notice: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/notices/<notice_id>", methods=["PUT"])
@token_required
@role_required(['admin'])
def update_notice(current_user, notice_id):
    try:
        notice = Notice.objects(id=ObjectId(notice_id), created_by=str(current_user.id)).first()
        if not notice:
            return jsonify({"error": "Notice not found or unauthorized"}), 404
            
        form_data = request.form
        
        # ... (all your field updates) ...
        notice.title = form_data.get('title', notice.title)
        notice.subject = form_data.get('subject', notice.subject)
        notice.content = form_data.get('content', notice.content)
        notice.notice_type = form_data.get('notice_type', notice.notice_type)
        notice.departments = json.loads(form_data.get('departments', json.dumps(notice.departments)))
        notice.program_course = form_data.get('program_course', notice.program_course)
        notice.specialization = form_data.get('specialization', notice.specialization)
        notice.year = form_data.get('year', notice.year)
        notice.section = form_data.get('section', notice.section)
        notice.recipient_emails = json.loads(form_data.get('recipient_emails', json.dumps(notice.recipient_emails)))
        notice.priority = form_data.get('priority', notice.priority)
        notice.send_options = json.loads(form_data.get('send_options', json.dumps(notice.send_options)))
        notice.schedule_date = form_data.get('schedule_date', str(notice.schedule_date)).lower() == 'true'
        notice.schedule_time = form_data.get('schedule_time', str(notice.schedule_time)).lower() == 'true'
        notice.date = form_data.get('date', notice.date)
        notice.time = form_data.get('time', notice.time)
        notice.from_field = form_data.get('from', notice.from_field)
        notice.status = form_data.get('status', notice.status)

        # ... (attachment handling) ...

        # Update scheduling
        if notice.schedule_date and notice.date:
            if notice.schedule_time and notice.time:
                datetime_str = f"{notice.date} {notice.time}"
                notice.publish_at = datetime.datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
            else:
                notice.publish_at = datetime.datetime.strptime(notice.date, '%Y-%m-%d')
            
            if notice.publish_at > datetime.datetime.now():
                notice.status = 'scheduled'
            else:
                notice.status = 'published'

        notice.updated_at = datetime.datetime.now()
        notice.save()
        
        # Send email if the notice is published and has recipients (checkbox is ignored)
        if notice.status == 'published' and notice.recipient_emails:
            print(f"Attempting to send email for updated notice: {notice.title}")
            send_bulk_email(
                recipient_emails=notice.recipient_emails,
                subject=notice.subject or notice.title,
                body=notice.content
            )

        return jsonify({"message": "Notice updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/notices/<notice_id>", methods=["DELETE"])
@token_required
@role_required(['admin'])
def delete_notice(current_user, notice_id):
    try:
        notice = Notice.objects(id=ObjectId(notice_id), createdBy=str(current_user.id)).first()
        
        if not notice:
            return jsonify({"error": "Notice not found or unauthorized"}), 404
            
        notice.delete()
        return jsonify({"message": "Notice deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/users", methods=["GET"])
@token_required
@role_required(['admin'])
def get_users(current_user):
    try:
        # if current_user.role != "admin":
            # return jsonify({"error": "Unauthorized"}), 403
                
        users = User.objects().only('id', 'name', 'email')
        return jsonify([{
            "id": str(user.id),
            "name": user.name,
            "email": user.email
        } for user in users]), 200
    except Exception as e:
        print(f"Users error: {str(e)}")
        return jsonify({"error": "Failed to fetch users"}), 500


@app.route("/api/notices/analytics", methods=["GET"])
@token_required
@role_required(['admin'])
def get_all_notices_analytics(current_user):
    try:
        # If you add readBy field to schema
        total_reads = sum(len(notice.readBy) for notice in Notice.objects())
        
        # Or if you don't have read tracking
        total_notices = Notice.objects.count()
        
        return jsonify({
            "totalNotices": total_notices,
            # "totalReads": total_reads,  # Only include if you have readBy field
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/count", methods=["GET"])
@token_required
@role_required(['admin'])
def get_users_count(current_user):
    try:
        count = User.objects.count()
        return jsonify({"count": count}), 200
    except Exception as e:
        print(f"Error counting users: {str(e)}")
        return jsonify({"error": "Failed to count users"}), 500 


@app.route("/api/auth/current-user", methods=["GET"])
@token_required
@role_required(['admin','user'])
def get_current_user(current_user):
    try:
        return jsonify({
            "id": str(current_user.id),
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    # In JWT, logout is handled client-side by discarding tokens
    return jsonify({"message": "Logged out successfully"}), 200


@app.route("/api/notices/created-by/<user_id>", methods=["GET"])
@token_required
def get_notices_by_creator(current_user, user_id):
    try:
        # Verify the requesting user has permission
        if current_user.role != "admin" and str(current_user.id) != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        notices = Notice.objects(created_by=user_id).order_by('-created_at')
        
        user_map = {str(user.id): user for user in User.objects.only('id', 'name', 'email')}
        
        notices_data = []
        for notice in notices:
            creator = user_map.get(notice.created_by)
            notices_data.append({
                "id": str(notice.id),
                "title": notice.title,
                "content": notice.content,
                "notice_type": notice.notice_type,
                "departments": notice.departments,
                "year": notice.year,
                "section": notice.section,
                "recipient_emails": notice.recipient_emails,
                "priority": notice.priority,
                "status": notice.status,
                "publish_at": notice.publish_at.isoformat() if notice.publish_at else None,
                "created_at": notice.created_at.isoformat(),
                "updated_at": notice.updated_at.isoformat(),
                "created_by": {
                    "id": notice.created_by,
                    "name": creator.name if creator else "Unknown",
                    "email": creator.email if creator else ""
                },
                "attachments": notice.attachments
            })
            
        return jsonify(notices_data), 200
        
    except Exception as e:
        print(f"Error fetching user's notices: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "error": "Failed to fetch notices",
            "details": str(e)
        }), 500
    

    # ///////////////////// Methods to upload Student details ///////////////////////

# Password generation helper
def generate_password(length=6):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

# Excel date to ISO converter
def excel_date_to_iso(excel_date):
    try:
        return (datetime(1899, 12, 30) + timedelta(days=float(excel_date))).isoformat()
    except:
        return None



# Student login endpoint
@app.route("/api/students/login", methods=["POST"])
def student_login():
    try:
        data = request.json
        student = Student.objects(univ_roll_no=data.get('univ_roll_no')).first()
        
        if not student or not check_password_hash(student.password, data.get('password', '')):
            return jsonify({"error": "Invalid credentials"}), 401
            
        # Generate token (similar to your user login)
        access_token = jwt.encode({
            'student_id': str(student.id),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            "accessToken": access_token,
            "student": {
                "name": student.name,
                "univ_roll_no": student.univ_roll_no,
                "course": student.course,
                "branch": student.branch
            }
        }), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Helper function to find a value in a row using multiple possible column names
def get_column_value(row, column_map, field_name):
    for column_name in column_map[field_name]:
        if column_name in row:
            return str(row[column_name]).strip()
    return "" # Return empty string if no matching column is found

@app.route("/api/students/upload-details", methods=["POST"])
@token_required
@role_required(['admin'])
def upload_student_details(current_user):
    COLUMN_MAP = {
        'name': ['name', 'student name', 'student_name'],
        'univ_roll_no': ['univ_roll_no', 'univ rollno', 'univ. rollno.', 'roll no', 'roll_no'],
        'class_roll_no': ['class_roll_no', 'class roll no'],
        'email': ['email', 'email id', 'official_email', 'official email-id'],
        'father_name': ['fathers name', 'father_name', 'father name'],
        'student_mobile': ['stu. mob.', 'student_mobile', 'mobile no', 'student contact'],
        'father_mobile': ['father mob.', 'father_mobile', 'father contact']
    }

    try:
        department = request.form.get('department')
        course = request.form.get('course')
        year = request.form.get('year')
        section = request.form.get('section')
        file = request.files.get('file')

        if not all([department, course, year, section, file]):
            return jsonify({"error": "Missing required form data or file."}), 400

        print("✅ Student file received. Attempting to read...")
        try:
            if file.filename.lower().endswith('.csv'):
                df = pd.read_csv(file, encoding='utf-8', skipinitialspace=True)
            else:
                df = pd.read_excel(file)
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": f"Could not read the file. Details: {str(e)}"}), 400

        df.columns = [col.strip().lower() for col in df.columns]
        df = df.fillna('')
        print(f"✅ File read successfully. Found {len(df)} rows.")

        students_to_create = []
        conflicts = []  # To hold conflicting student data from the file
        errors = []     # For actual processing errors

        for index, row in df.iterrows():
            univ_roll_no = get_column_value(row, COLUMN_MAP, 'univ_roll_no')
            if not univ_roll_no:
                errors.append(f"Row {index + 2}: Skipped. Missing University Roll Number.")
                continue

            if Student.objects(univ_roll_no=univ_roll_no).first():
                # This is a conflict. Capture data from the file row.
                conflict_data = {
                    'branch': department, 'course': course, 'year': year, 'section': section,
                    'univ_roll_no': univ_roll_no,
                    'name': get_column_value(row, COLUMN_MAP, 'name'),
                    'class_roll_no': get_column_value(row, COLUMN_MAP, 'class_roll_no'),
                    'father_name': get_column_value(row, COLUMN_MAP, 'father_name'),
                    'student_mobile': get_column_value(row, COLUMN_MAP, 'student_mobile'),
                    'father_mobile': get_column_value(row, COLUMN_MAP, 'father_mobile'),
                    'official_email': get_column_value(row, COLUMN_MAP, 'email'),
                }
                conflicts.append(conflict_data)
                continue

            # This part is only reached for NEW students
            raw_password = generate_password()
            official_email = get_column_value(row, COLUMN_MAP, 'email')
            login_email = official_email if official_email else f"{univ_roll_no}@university.edu"
            student = Student(
                branch=department, course=course, year=year, section=section,
                univ_roll_no=univ_roll_no,
                name=get_column_value(row, COLUMN_MAP, 'name'),
                class_roll_no=get_column_value(row, COLUMN_MAP, 'class_roll_no'),
                father_name=get_column_value(row, COLUMN_MAP, 'father_name'),
                student_mobile=get_column_value(row, COLUMN_MAP, 'student_mobile'),
                father_mobile=get_column_value(row, COLUMN_MAP, 'father_mobile'),
                official_email=official_email,
                email=login_email.lower(),
                password=generate_password_hash(raw_password),
                raw_password=raw_password
            )
            students_to_create.append(student)

        if students_to_create:
            Student.objects.insert(students_to_create)

        message = f"Process complete. Successfully created {len(students_to_create)} new students."
        if not students_to_create and not conflicts and not errors:
             message = "No new students were added. The file may have been empty or contained only existing records."

        return jsonify({
            "message": message,
            "conflicts": conflicts,
            "errors": errors
        }), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"An unexpected server error occurred: {str(e)}"}), 500
     
@app.route("/api/students/add-manual", methods=["POST"])
@token_required
@role_required(['admin'])
def add_student_manual(current_user):
    try:
        data = request.json
        univ_roll_no = data.get('univ_roll_no')
        
        existing_student = Student.objects(univ_roll_no=univ_roll_no).first()
        if existing_student:
            student_data = json.loads(existing_student.to_json())
            return jsonify({
                "error": f"Student with Roll Number '{univ_roll_no}' already exists.",
                "existing_data": student_data
            }), 409

        raw_password = generate_password()
        student = Student(
            branch=data.get('department'),
            course=data.get('course'),
            year=data.get('year'),
            section=data.get('section'),
            name=data.get('name'),
            univ_roll_no=univ_roll_no,
            father_name=data.get('father_name'),
            father_mobile=data.get('father_mobile'),
            official_email=data.get('official_email', '').lower(),
            email=data.get('official_email', '').lower(),
            password=generate_password_hash(raw_password),
            raw_password=raw_password
        )
        student.save()
        return jsonify({"message": f"Successfully created student '{data.get('name')}'."}), 201
    except Exception as e:
        return jsonify({"error": f"An unexpected server error: {str(e)}"}), 500
    

# Get students by branch/course (for notice targeting)
@app.route("/api/students", methods=["GET"])
@token_required
def get_students(current_user):
    try:
        branch = request.args.get('branch')
        course = request.args.get('course')
        
        query = {}
        if branch:
            query["branch"] = branch
        if course:
            query["course"] = course
            
        students = Student.objects(**query).only(
            'email', 'official_email', 'name', 'univ_roll_no', 'course', 'branch'
        )
        
        return jsonify([{
            "email": s.official_email or s.email,
            "name": s.name,
            "univ_roll_no": s.univ_roll_no,
            "course": s.course,
            "branch": s.branch
        } for s in students]), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    

from flask import send_file
import os

@app.route('/api/students/template')
@token_required
def download_student_template(current_user):
    try:
        # Path to your template file
        template_path = os.path.join(os.path.dirname(__file__), 'static', 'templates', 'student_template.xlsx')
        
        # Verify file exists
        if not os.path.exists(template_path):
            return jsonify({"error": "Template file not found"}), 404
            
        return send_file(
            template_path,
            as_attachment=True,
            download_name="student_data_template.xlsx",
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add this one-time seeder route to app.py

@app.route('/api/setup/seed-departments', methods=['GET'])
def seed_departments():
    # Check if data already exists to prevent duplicates
    if Department.objects.count() > 0:
        return jsonify({"message": "Departments have already been seeded."}), 400

    department_data = [
        {"name": "Computer Engineering & Applications", "code": "CEA", "courses": [
            {"name": "B.Tech in CSE", "code": "BTECH_CSE"},
            {"name": "B.Tech (Hons.) CSE (Specialization in AI & Analytics)", "code": "BTECH_HONS_AI"},
            {"name": "B.Tech CSE (Specialization in AIML)", "code": "BTECH_AIML"},
            {"name": "B.Tech Lateral Entry – CSE", "code": "BTECH_LAT_CSE"},
            {"name": "BCA / BCA (Hons./By Research)", "code": "BCA"},
            {"name": "BCA Data Science", "code": "BCA_DS"},
            {"name": "BCA in Digital Marketing", "code": "BCA_DM"}
        ]},
        {"name": "Electronics & Communication Engineering (ECE)", "code": "ECE", "courses": [
            {"name": "B.Tech in Electronics and Computer Engineering", "code": "BTECH_ECS"},
            {"name": "B.Tech EC (Minor in CS)", "code": "BTECH_EC_CS"},
            {"name": "B.Tech EC (Specialization in VLSI)", "code": "BTECH_EC_VLSI"},
            {"name": "B.Tech in ECE", "code": "BTECH_ECE"},
            {"name": "B.Tech Lateral Entry – EC, ECE", "code": "BTECH_LAT_ECE"}
        ]},
        {"name": "Electrical Engineering", "code": "EE", "courses": [
            {"name": "B.Tech in EE", "code": "BTECH_EE"},
            {"name": "B.Tech in EEE", "code": "BTECH_EEE"},
            {"name": "B.Tech EE (EV Technology)", "code": "BTECH_EE_EV"},
            {"name": "B.Tech EE (Minor in CS)", "code": "BTECH_EE_CS"},
            {"name": "B.Tech Lateral Entry – EE, EEE, EE (EV Technology)", "code": "BTECH_LAT_EE"}
        ]},
        {"name": "Mechanical Engineering", "code": "ME", "courses": [
            {"name": "B.Tech in ME", "code": "BTECH_ME"},
            {"name": "B.Tech ME (Minor in CS)", "code": "BTECH_ME_CS"},
            {"name": "B.Tech ME (Automobile)", "code": "BTECH_ME_AUTO"},
            {"name": "B.Tech ME (Mechatronics)", "code": "BTECH_ME_MECHA"},
            {"name": "B.Tech Lateral Entry – ME", "code": "BTECH_LAT_ME"},
            {"name": "ME in Smart Manufacturing", "code": "MTECH_SM"}
        ]},
        {"name": "Civil Engineering", "code": "CE", "courses": [
            {"name": "B.Tech in CE", "code": "BTECH_CE"},
            {"name": "B.Tech Lateral Entry – CE", "code": "BTECH_LAT_CE"}
        ]},
        {"name": "Biotechnology", "code": "BT", "courses": [
            {"name": "B.Tech in Biotech", "code": "BTECH_BT"},
            {"name": "B.Tech Lateral Entry – Biotech", "code": "BTECH_LAT_BT"},
            {"name": "B.Sc. Biotech / B.Sc. Biotech (Hons./By Research)", "code": "BSC_BT"}
        ]},
        {"name": "Pharmaceutical Sciences", "code": "PHARM", "courses": [
            {"name": "B.Pharm", "code": "BPHARM"},
            {"name": "B.Pharm (Lateral Entry)", "code": "BPHARM_LAT"},
            {"name": "Pharm.D", "code": "PHARMD"}
        ]},
        {"name": "Faculty of Agricultural Sciences", "code": "AGRI", "courses": [
            {"name": "B.Sc. (Hons.) Agriculture", "code": "BSC_AGRI"}
        ]},
        {"name": "Physics / Chemistry / Mathematics", "code": "SCI", "courses": [
            {"name": "B.Sc. Physics / B.Sc. Physics (Hons./By Research)", "code": "BSC_PHY"},
            {"name": "B.Sc. Chemistry / B.Sc. Chemistry (Hons./By Research)", "code": "BSC_CHEM"},
            {"name": "B.Sc. Maths / B.Sc. Maths (Hons./By Research in DS)", "code": "BSC_MATH"}
        ]},
        {"name": "Social Science & Humanities / English", "code": "HUM", "courses": [
            {"name": "B.A. Eng / B.A. Eng (Hons./By Research)", "code": "BA_ENG"},
            {"name": "B.A. Eco / B.A. Eco (Hons./By Research)", "code": "BA_ECO"}
        ]},
        {"name": "Business Management / Commerce", "code": "MGMT", "courses": [
            {"name": "BBA / BBA (Hons./By Research)", "code": "BBA"},
            {"name": "BBA (Family Business)", "code": "BBA_FB"},
            {"name": "BBA (Management Sciences)", "code": "BBA_MS"},
            {"name": "B.Com / B.Com (Hons./By Research)", "code": "BCOM"},
            {"name": "B.Com Global Accounting in Association with CIMA", "code": "BCOM_CIMA"}
        ]},
        {"name": "Legal Studies", "code": "LAW", "courses": [
            {"name": "BBA LLB (Hons.)", "code": "BBALLB"},
            {"name": "B.A. LLB (Hons.)", "code": "BALLB"}
        ]},
        {"name": "Faculty of Education", "code": "EDU", "courses": [
            {"name": "B.Ed.", "code": "BED"}
        ]},
        {"name": "Library & Information Science", "code": "LIB", "courses": [
            {"name": "Bachelor of Library and Information Science", "code": "BLIS"}
        ]}
    ]
    
    try:
        for dept_info in department_data:
            courses = [Course(name=c['name'], code=c['code']) for c in dept_info['courses']]
            department = Department(name=dept_info['name'], code=dept_info['code'], courses=courses)
            department.save()
        return jsonify({"message": f"Successfully seeded {len(department_data)} departments."}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500        


if __name__ == "__main__":
    app.run(debug=True, port=5001)

