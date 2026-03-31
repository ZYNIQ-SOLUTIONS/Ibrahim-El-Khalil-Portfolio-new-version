from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import os
import uuid
from typing import List, Optional, Annotated
import io
import textwrap
import re
import logging
from fastapi.responses import StreamingResponse

# PDF parsing support
HAS_PDF_PARSER = True
try:
    from PyPDF2 import PdfReader
except Exception:
    HAS_PDF_PARSER = False

# ReportLab is optional at runtime; building/installation may require system toolchain (Rust for some wheels)
HAS_REPORTLAB = True
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
except Exception:
    HAS_REPORTLAB = False


from auth import verify_token, init_keycloak
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def verify_admin_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        user_info = verify_token(credentials.credentials)
        return user_info
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

import requests
def generate_content_with_olla(prompt, system_instruction="You are a helpful assistant.", model="qwen2.5-coder"):
    url = "https://olla.zyniq.cloud/v1/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": "Bearer dummy"}
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }
    response = requests.post(url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

from database import (
    db, client, profile_collection, experience_collection, education_collection,
    skills_collection, ventures_collection, achievements_collection,
    whitepapers_collection, appointments_collection, analytics_collection,
    blogs_collection, is_mongodb_available
)
from models import (
    Profile, Experience, Education, SkillCategory, Venture,
    Achievements, WhitePaper, Appointment, BlogPost
)
from mem0_service import get_mem0_service

app = FastAPI(title="Ibrahim El Khalil Portfolio API")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Enable CORS with explicit origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now - restrict in production if needed
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Authentication function for admin endpoints
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'pass@123')

# Try to load password from database on startup
try:
    if is_mongodb_available():
        stored_password = db['admin_settings'].find_one({"setting": "admin_password"})
        if stored_password and stored_password.get('value'):
            ADMIN_PASSWORD = stored_password['value']
            logger.info("Loaded admin password from database")
except Exception as e:
    logger.warning(f"Could not load admin password from database: {e}")


# Database availability check
def require_database():
    """Check if database is available and raise error if not"""
    if not is_mongodb_available():
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable. Please check MongoDB connection."
        )

# Global exception handler for better error reporting
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Helper functions
def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

def generate_id():
    """Generate unique ID"""
    return str(uuid.uuid4())

# ==================== ROOT & HEALTH ====================
@app.get("/")
def read_root():
    return {"message": "Ibrahim El Khalil Portfolio API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "portfolio-backend"}

@app.get("/api/system-status")
def system_status():
    """Get comprehensive system status for admin dashboard"""
    import datetime
    import time
    import psutil
    from pymongo.errors import ServerSelectionTimeoutError
    
    try:
        # Measure response time
        start_time = time.time()
        
        # Test database connection
        db_status = {"connected": False, "error": None, "collections": {}}
        db_latency_start = time.time()
        try:
            if db is None:
                raise Exception("Database connection not initialized")
            
            # Test connection with a simple operation
            client.admin.command('ismaster')
            db_latency = round((time.time() - db_latency_start) * 1000, 2)  # Convert to ms
            db_status["connected"] = True
            db_status["latency"] = f"{db_latency}ms"
            
            # Get collection stats
            collections_info = {
                "profile": {"count": 0, "last_modified": None},
                "experience": {"count": 0, "last_modified": None},
                "education": {"count": 0, "last_modified": None},
                "skills": {"count": 0, "last_modified": None},
                "ventures": {"count": 0, "last_modified": None},
                "achievements": {"count": 0, "last_modified": None},
                "whitepapers": {"count": 0, "last_modified": None},
                "appointments": {"count": 0, "last_modified": None},
            }
            
            # Get document counts and last modified dates
            collections_info["profile"]["count"] = profile_collection.count_documents({})
            collections_info["experience"]["count"] = experience_collection.count_documents({})
            collections_info["education"]["count"] = education_collection.count_documents({})
            collections_info["skills"]["count"] = skills_collection.count_documents({})
            collections_info["ventures"]["count"] = ventures_collection.count_documents({})
            collections_info["achievements"]["count"] = achievements_collection.count_documents({})
            collections_info["whitepapers"]["count"] = whitepapers_collection.count_documents({})
            collections_info["appointments"]["count"] = appointments_collection.count_documents({})
            
            # Get last modified dates (if documents have timestamps)
            for coll_name, collection in [
                ("profile", profile_collection),
                ("experience", experience_collection),
                ("education", education_collection),
                ("skills", skills_collection),
                ("ventures", ventures_collection),
                ("achievements", achievements_collection),
                ("whitepapers", whitepapers_collection),
                ("appointments", appointments_collection),
            ]:
                try:
                    # Try to find the most recent document (works if there's a created_at or _id field)
                    latest_doc = collection.find_one({}, sort=[("_id", -1)])
                    if latest_doc and "_id" in latest_doc:
                        # Extract timestamp from MongoDB ObjectId
                        collections_info[coll_name]["last_modified"] = latest_doc["_id"].generation_time.isoformat()
                except Exception:
                    collections_info[coll_name]["last_modified"] = "Unknown"
            
            db_status["collections"] = collections_info
            
        except ServerSelectionTimeoutError as e:
            db_status["connected"] = False
            db_status["error"] = "Connection timeout"
            db_status["latency"] = "N/A"
        except Exception as e:
            db_status["connected"] = False
            db_status["error"] = str(e)
            db_status["latency"] = "N/A"
        
        # Get system metrics (CPU, Memory)
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            memory_used_gb = round(memory.used / (1024**3), 2)
            memory_total_gb = round(memory.total / (1024**3), 2)
            memory_percent = memory.percent
        except Exception:
            cpu_percent = 0
            memory_used_gb = 0
            memory_total_gb = 0
            memory_percent = 0
        
        # Backend status
        response_time = round((time.time() - start_time) * 1000, 2)  # in ms
        backend_status = {
            "status": "healthy",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "uptime": "Available", # Could implement actual uptime tracking
            "version": "1.0.0",
            "environment": {
                "has_gemini_api": bool(os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_API_KEY')),
                "has_mongo_uri": bool(os.getenv('MONGO_URL') or os.getenv('MONGODB_URI')),
                "has_admin_password": bool(ADMIN_PASSWORD),
                "has_cors_origins": True,  # CORS is configured in the app
                "port": os.getenv('PORT', '8001')
            }
        }
        
        # Overall system health
        overall_status = "healthy" if db_status["connected"] else "degraded"
        if not backend_status["environment"]["has_gemini_api"]:
            overall_status = "warning"
        if not backend_status["environment"]["has_mongo_uri"]:
            overall_status = "error"
        
        return {
            "overall_status": overall_status,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "response_time": f"{response_time}ms",
            "cpu_usage": f"{cpu_percent}%",
            "memory_usage": f"{memory_used_gb}GB / {memory_total_gb}GB ({memory_percent}%)",
            "uptime": "Available",
            "database": db_status,
            "backend": backend_status,
            "api_endpoints": {
                "total_endpoints": 25,  # Approximate count
                "authenticated_endpoints": 8,
                "public_endpoints": 17
            }
        }
        
    except Exception as e:
        return {
            "overall_status": "error",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "error": f"System status check failed: {str(e)}",
            "database": {"connected": False, "error": "Unknown"},
            "backend": {"status": "error"}
        }

# Handle preflight OPTIONS requests explicitly
@app.options("/{full_path:path}")
def handle_options(full_path: str):
    """Handle preflight OPTIONS requests"""
    from fastapi import Response
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Max-Age"] = "86400"
    return response

# ==================== PROFILE ====================
@app.get("/api/profile")
def get_profile():
    """Get profile data"""
    require_database()
    try:
        profile = profile_collection.find_one({})
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return serialize_doc(profile)
    except Exception as e:
        logger.error(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.put("/api/profile")
def update_profile(profile: Profile, _: bool = Depends(verify_admin_auth)):
    """Update profile data (Admin only)"""
    require_database()
    try:
        profile_data = profile.dict()
        result = profile_collection.update_one(
            {},
            {"$set": profile_data},
            upsert=True
        )
        return {"success": True, "message": "Profile updated successfully"}
    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# ==================== ADMIN PASSWORD ====================
@app.post("/api/admin/validate-password")
async def validate_admin_password(data: dict = Body(...)):
    """Validate admin password for login"""
    password = data.get("password")
    
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")
    
    if password == ADMIN_PASSWORD:
        return {"success": True, "message": "Password is valid"}
    else:
        raise HTTPException(status_code=401, detail="Invalid password")

@app.post("/api/admin/change-password")
async def change_admin_password(data: dict = Body(...), authorization: Annotated[str | None, Header()] = None):
    """Change admin password (Admin only)"""
    global ADMIN_PASSWORD
    
    # Get current password from request body or authorization header
    current_password = data.get("current_password")
    if not current_password and authorization:
        current_password = authorization.replace('Bearer ', '')
    
    if not current_password:
        raise HTTPException(status_code=400, detail="Current password is required")
    
    # Verify current password
    if current_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Validate new password
    new_password = data.get("new_password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    
    # Update password in environment variable (runtime only - not persistent)
    ADMIN_PASSWORD = new_password
    
    # Store in database for persistence
    try:
        require_database()
        db['admin_settings'].update_one(
            {"setting": "admin_password"},
            {"$set": {"setting": "admin_password", "value": new_password}},
            upsert=True
        )
    except Exception as e:
        logger.warning(f"Could not persist password to database: {e}")
    
    return {
        "success": True,
        "message": "Password changed successfully. Please use the new password for future logins."
    }

# ==================== EXPERIENCE ====================
@app.get("/api/experience")
def get_experience():
    """Get all experience entries"""
    experiences = list(experience_collection.find({}))
    return [serialize_doc(exp) for exp in experiences]

@app.post("/api/experience")
def create_experience(experience: Experience):
    """Create new experience entry"""
    exp_data = experience.dict()
    exp_data['id'] = generate_id()
    experience_collection.insert_one(exp_data)
    return {"success": True, "id": exp_data['id'], "message": "Experience created"}

@app.put("/api/experience/{exp_id}")
def update_experience(exp_id: str, experience: Experience):
    """Update experience entry"""
    exp_data = experience.dict()
    result = experience_collection.update_one(
        {"id": exp_id},
        {"$set": exp_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Experience not found")
    return {"success": True, "message": "Experience updated"}

@app.delete("/api/experience/{exp_id}")
def delete_experience(exp_id: str):
    """Delete experience entry"""
    result = experience_collection.delete_one({"id": exp_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Experience not found")
    return {"success": True, "message": "Experience deleted"}

# ==================== EDUCATION ====================
@app.get("/api/education")
def get_education():
    """Get all education entries"""
    education = list(education_collection.find({}))
    return [serialize_doc(edu) for edu in education]

@app.post("/api/education")
def create_education(education: Education):
    """Create new education entry"""
    edu_data = education.dict()
    edu_data['id'] = generate_id()
    education_collection.insert_one(edu_data)
    return {"success": True, "id": edu_data['id'], "message": "Education created"}

@app.put("/api/education/{edu_id}")
def update_education(edu_id: str, education: Education):
    """Update education entry"""
    edu_data = education.dict()
    result = education_collection.update_one(
        {"id": edu_id},
        {"$set": edu_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Education not found")
    return {"success": True, "message": "Education updated"}

@app.delete("/api/education/{edu_id}")
def delete_education(edu_id: str):
    """Delete education entry"""
    result = education_collection.delete_one({"id": edu_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Education not found")
    return {"success": True, "message": "Education deleted"}

# ==================== SKILLS ====================
@app.get("/api/skills")
def get_skills():
    """Get all skill categories"""
    skills = list(skills_collection.find({}))
    return [serialize_doc(skill) for skill in skills]

@app.post("/api/skills")
def create_skill_category(skill_category: SkillCategory):
    """Create new skill category"""
    skill_data = skill_category.dict()
    skill_data['id'] = generate_id()
    skills_collection.insert_one(skill_data)
    return {"success": True, "id": skill_data['id'], "message": "Skill category created"}

@app.put("/api/skills/{skill_id}")
def update_skill_category(skill_id: str, skill_category: SkillCategory):
    """Update skill category"""
    skill_data = skill_category.dict()
    result = skills_collection.update_one(
        {"id": skill_id},
        {"$set": skill_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Skill category not found")
    return {"success": True, "message": "Skill category updated"}

@app.delete("/api/skills/{skill_id}")
def delete_skill_category(skill_id: str):
    """Delete skill category"""
    result = skills_collection.delete_one({"id": skill_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Skill category not found")
    return {"success": True, "message": "Skill category deleted"}

# ==================== VENTURES ====================
@app.get("/api/ventures")
def get_ventures():
    """Get all ventures"""
    ventures = list(ventures_collection.find({}))
    return [serialize_doc(venture) for venture in ventures]

@app.post("/api/ventures")
def create_venture(venture: Venture):
    """Create new venture"""
    venture_data = venture.dict()
    venture_data['id'] = generate_id()
    ventures_collection.insert_one(venture_data)
    return {"success": True, "id": venture_data['id'], "message": "Venture created"}

@app.put("/api/ventures/{venture_id}")
def update_venture(venture_id: str, venture: Venture):
    """Update venture"""
    venture_data = venture.dict()
    result = ventures_collection.update_one(
        {"id": venture_id},
        {"$set": venture_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Venture not found")
    return {"success": True, "message": "Venture updated"}

@app.delete("/api/ventures/{venture_id}")
def delete_venture(venture_id: str):
    """Delete venture"""
    result = ventures_collection.delete_one({"id": venture_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Venture not found")
    return {"success": True, "message": "Venture deleted"}

# ==================== ACHIEVEMENTS ====================
@app.get("/api/achievements")
def get_achievements():
    """Get achievements (certificates and hackathons)"""
    achievements = achievements_collection.find_one({})
    if not achievements:
        return {"certificates": [], "hackathons": []}
    return serialize_doc(achievements)

@app.put("/api/achievements")
def update_achievements(achievements: Achievements):
    """Update achievements"""
    ach_data = achievements.dict()
    result = achievements_collection.update_one(
        {},
        {"$set": ach_data},
        upsert=True
    )
    return {"success": True, "message": "Achievements updated"}

# ==================== WHITE PAPERS ====================
@app.get("/api/whitepapers")
def get_whitepapers():
    """Get all white papers"""
    papers = list(whitepapers_collection.find({}))
    return [serialize_doc(paper) for paper in papers]

@app.post("/api/whitepapers")
def create_whitepaper(whitepaper: WhitePaper):
    """Create new white paper"""
    paper_data = whitepaper.dict()
    paper_data['id'] = generate_id()
    whitepapers_collection.insert_one(paper_data)
    return {"success": True, "id": paper_data['id'], "message": "White paper created"}

@app.put("/api/whitepapers/{paper_id}")
def update_whitepaper(paper_id: str, whitepaper: WhitePaper):
    """Update white paper"""
    paper_data = whitepaper.dict()
    result = whitepapers_collection.update_one(
        {"id": paper_id},
        {"$set": paper_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="White paper not found")
    return {"success": True, "message": "White paper updated"}

@app.delete("/api/whitepapers/{paper_id}")
def delete_whitepaper(paper_id: str):
    """Delete white paper"""
    result = whitepapers_collection.delete_one({"id": paper_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="White paper not found")
    return {"success": True, "message": "White paper deleted"}

# ==================== APPOINTMENTS ====================
@app.get("/api/appointments")
def get_appointments():
    """Get all appointments"""
    appointments = list(appointments_collection.find({}))
    return [serialize_doc(apt) for apt in appointments]

@app.post("/api/appointments")
def create_appointment(appointment: Appointment):
    """Create new appointment"""
    apt_data = appointment.dict()
    apt_data['id'] = generate_id()
    apt_data['created_at'] = datetime.utcnow().isoformat()
    apt_data['status'] = 'pending'
    appointments_collection.insert_one(apt_data)
    
    # Update analytics
    analytics_collection.update_one(
        {},
        {"$inc": {"appointments_booked": 1}}
    )
    
    return {"success": True, "id": apt_data['id'], "message": "Appointment created"}

@app.put("/api/appointments/{apt_id}")
def update_appointment(apt_id: str, appointment: Appointment):
    """Update appointment"""
    apt_data = appointment.dict()
    result = appointments_collection.update_one(
        {"id": apt_id},
        {"$set": apt_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"success": True, "message": "Appointment updated"}

@app.delete("/api/appointments/{apt_id}")
def delete_appointment(apt_id: str):
    """Delete appointment"""
    result = appointments_collection.delete_one({"id": apt_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"success": True, "message": "Appointment deleted"}

# ==================== BLOG POSTS ====================
@app.get("/api/blogs")
def get_blogs(status: Optional[str] = None, category: Optional[str] = None, limit: Optional[int] = None):
    """Get all blog posts with optional filtering"""
    try:
        query = {}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        
        cursor = blogs_collection.find(query).sort("created_at", -1)
        if limit:
            cursor = cursor.limit(limit)
        
        blogs = [serialize_doc(blog) for blog in cursor]
        return blogs
    except Exception as e:
        logger.error(f"Error fetching blogs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/blogs/{blog_id}")
def get_blog(blog_id: str):
    """Get a single blog post by ID or slug"""
    try:
        # Try to find by ID first, then by slug
        blog = blogs_collection.find_one({"id": blog_id})
        if not blog:
            blog = blogs_collection.find_one({"slug": blog_id})
        
        if not blog:
            raise HTTPException(status_code=404, detail="Blog post not found")
        
        # Increment view count
        blogs_collection.update_one(
            {"id": blog.get("id")},
            {"$inc": {"views": 1}}
        )
        
        return serialize_doc(blog)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching blog: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/blogs")
def create_blog(blog: BlogPost):
    """Create a new blog post"""
    try:
        blog_dict = blog.dict(exclude_none=True)
        blog_id = str(uuid.uuid4())
        blog_dict["id"] = blog_id
        blog_dict["created_at"] = datetime.utcnow().isoformat()
        blog_dict["updated_at"] = datetime.utcnow().isoformat()
        
        # Generate slug from title if not provided
        if not blog_dict.get("slug"):
            blog_dict["slug"] = re.sub(r'[^a-z0-9]+', '-', blog_dict["title"].lower()).strip('-')
        
        # Calculate reading time if not provided (approx 200 words per minute)
        if not blog_dict.get("reading_time") and blog_dict.get("content"):
            word_count = len(blog_dict["content"].split())
            blog_dict["reading_time"] = max(1, round(word_count / 200))
        
        blogs_collection.insert_one(blog_dict)
        return serialize_doc(blog_dict)
    except Exception as e:
        logger.error(f"Error creating blog: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/blogs/{blog_id}")
def update_blog(blog_id: str, blog: BlogPost):
    """Update an existing blog post"""
    try:
        existing_blog = blogs_collection.find_one({"id": blog_id})
        if not existing_blog:
            raise HTTPException(status_code=404, detail="Blog post not found")
        
        blog_dict = blog.dict(exclude_none=True)
        blog_dict["updated_at"] = datetime.utcnow().isoformat()
        
        # Update slug if title changed
        if blog_dict.get("title") and blog_dict["title"] != existing_blog.get("title"):
            if not blog_dict.get("slug"):
                blog_dict["slug"] = re.sub(r'[^a-z0-9]+', '-', blog_dict["title"].lower()).strip('-')
        
        # Recalculate reading time if content changed
        if blog_dict.get("content") and blog_dict["content"] != existing_blog.get("content"):
            word_count = len(blog_dict["content"].split())
            blog_dict["reading_time"] = max(1, round(word_count / 200))
        
        blogs_collection.update_one(
            {"id": blog_id},
            {"$set": blog_dict}
        )
        
        updated_blog = blogs_collection.find_one({"id": blog_id})
        return serialize_doc(updated_blog)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating blog: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/blogs/{blog_id}")
def delete_blog(blog_id: str):
    """Delete a blog post"""
    try:
        result = blogs_collection.delete_one({"id": blog_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Blog post not found")
        return {"success": True, "message": "Blog post deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting blog: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/blogs/generate")
async def generate_blog_with_ai(data: dict = Body(...)):
    """Generate blog content using Gemini AI"""
    try:
        topic = data.get("topic", "")
        category = data.get("category", "")
        tone = data.get("tone", "professional")
        length = data.get("length", "medium")
        
        if not topic:
            raise HTTPException(status_code=400, detail="Topic is required")
        
        # Check if Gemini API is available
        if False:
            # Return a demo blog post when API key is not available
            word_count = {"short": 500, "medium": 1000, "long": 1500}.get(length, 1000)
            demo_content = f"""# {topic}

## Introduction

This is a sample blog post about {topic}. This content is generated as a placeholder since the Gemini AI API key is not configured.

## Main Content

To enable AI-powered blog generation, you need to:

1. Get a Gemini API key from Google AI Studio
2. Add it to your environment variables
3. Restart the backend service

## Key Points

- This feature requires a valid Gemini API key
- The AI can generate professional content in various tones
- Blog posts can be customized by length and category
- Generated content includes SEO optimization

## Conclusion

Once properly configured, this feature will generate high-quality blog content tailored to your specifications using Google's Gemini AI model.

*Note: This is demo content. Configure your Gemini API key to enable AI generation.*"""

            return {
                "title": f"Sample: {topic}",
                "excerpt": f"This is a sample blog post about {topic}. Configure Gemini API for AI generation.",
                "content": demo_content,
                "tags": [category, "sample", "demo"] if category else ["sample", "demo"],
                "seo_title": f"{topic} - Sample Blog Post",
                "seo_description": f"Learn about {topic} in this sample blog post. Configure AI for automated content generation.",
                "ai_generated": False,
                "demo": True
            }
        
        # Import Gemini if available
        try:
            ai_response = generate_content_with_olla(full_prompt, system_instruction)
            
            # Store conversation in memory
            if mem0_service.is_available():
                conversation = [
                    {"role": "user", "content": message},
                    {"role": "assistant", "content": ai_response}
                ]
                mem0_service.add_conversation(
                    conversation,
                    user_id=user_id,
                    metadata={
                        "session_id": session_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            
            # Track analytics
            analytics_collection.update_one(
                {},
                {"$inc": {"ai_chat_sessions": 1}},
                upsert=True
            )
            
            return {
                "response": ai_response,
                "has_memory": mem0_service.is_available(),
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"Error in AI chat: {e}")
            raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in AI chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== MEMORY MANAGEMENT ====================
# ==================== SECTION VISIBILITY SETTINGS ====================
@app.get("/api/section-visibility")
async def get_section_visibility():
    """Get section visibility settings for portfolio"""
    try:
        if not is_mongodb_available():
            # Return default settings if MongoDB is not available
            default_sections = [
                {"section_name": "hero", "is_visible": True, "display_order": 0},
                {"section_name": "ventures", "is_visible": True, "display_order": 1},
                {"section_name": "experience", "is_visible": True, "display_order": 2},
                {"section_name": "education", "is_visible": True, "display_order": 3},
                {"section_name": "achievements", "is_visible": True, "display_order": 4},
                {"section_name": "blog", "is_visible": True, "display_order": 5}
            ]
            return {"sections": default_sections}
        
        collection = db['section_visibility']
        sections = list(collection.find({}, {"_id": 0}))
        
        # If no settings exist, create default ones
        if not sections:
            default_sections = [
                {"section_name": "hero", "is_visible": True, "display_order": 0, "last_updated": datetime.now().isoformat()},
                {"section_name": "ventures", "is_visible": True, "display_order": 1, "last_updated": datetime.now().isoformat()},
                {"section_name": "experience", "is_visible": True, "display_order": 2, "last_updated": datetime.now().isoformat()},
                {"section_name": "education", "is_visible": True, "display_order": 3, "last_updated": datetime.now().isoformat()},
                {"section_name": "achievements", "is_visible": True, "display_order": 4, "last_updated": datetime.now().isoformat()},
                {"section_name": "blog", "is_visible": True, "display_order": 5, "last_updated": datetime.now().isoformat()}
            ]
            
            # Insert default settings
            collection.insert_many(default_sections)
            sections = default_sections
        
        return {"sections": sections}
        
    except Exception as e:
        logger.error(f"Error getting section visibility: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/section-visibility")
async def update_section_visibility(sections_data: dict = Body(...), _: bool = Depends(verify_admin_auth)):
    """Update section visibility settings (Admin only)"""
    try:
        if not is_mongodb_available():
            raise HTTPException(status_code=503, detail="Database not available")
        
        collection = db['section_visibility']
        sections = sections_data.get('sections', [])
        
        # Update each section
        for section in sections:
            section['last_updated'] = datetime.now().isoformat()
            collection.update_one(
                {"section_name": section['section_name']},
                {"$set": section},
                upsert=True
            )
        
        return {"success": True, "message": "Section visibility updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating section visibility: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/portfolio-settings")
async def get_portfolio_settings(_: bool = Depends(verify_admin_auth)):
    """Get portfolio settings including section visibility (Admin only)"""
    try:
        if not is_mongodb_available():
            return {
                "maintenance_mode": False,
                "show_ai_chat": True,
                "show_appointment_booking": True,
                "analytics_enabled": True,
                "section_visibility": []
            }
        
        settings_collection = db['portfolio_settings']
        visibility_collection = db['section_visibility']
        
        # Get general settings
        settings = settings_collection.find_one({}, {"_id": 0})
        if not settings:
            settings = {
                "maintenance_mode": False,
                "show_ai_chat": True,
                "show_appointment_booking": True,
                "analytics_enabled": True
            }
        
        # Get section visibility
        sections = list(visibility_collection.find({}, {"_id": 0}))
        settings['section_visibility'] = sections
        
        return settings
        
    except Exception as e:
        logger.error(f"Error getting portfolio settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/portfolio-settings")
async def update_portfolio_settings(settings_data: dict = Body(...), _: bool = Depends(verify_admin_auth)):
    """Update portfolio settings (Admin only)"""
    try:
        if not is_mongodb_available():
            raise HTTPException(status_code=503, detail="Database not available")
        
        settings_collection = db['portfolio_settings']
        
        # Extract section visibility from settings
        sections = settings_data.pop('section_visibility', [])
        
        # Update general settings
        settings_data['last_updated'] = datetime.now().isoformat()
        settings_collection.update_one(
            {},
            {"$set": settings_data},
            upsert=True
        )
        
        # Update section visibility if provided
        if sections:
            visibility_collection = db['section_visibility']
            for section in sections:
                section['last_updated'] = datetime.now().isoformat()
                visibility_collection.update_one(
                    {"section_name": section['section_name']},
                    {"$set": section},
                    upsert=True
                )
        
        return {"success": True, "message": "Portfolio settings updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating portfolio settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== MEMORY ENDPOINTS ====================
@app.get("/api/memories")
async def get_memories(user_id: str = "anonymous", limit: Optional[int] = None):
    """Get all memories for a user"""
    try:
        mem0_service = get_mem0_service()
        
        if not mem0_service.is_available():
            return {
                "success": False,
                "message": "Memory service not available",
                "memories": []
            }
        
        if limit:
            # Search with limit
            memories = mem0_service.search_memories("", user_id, limit)
        else:
            # Get all memories
            memories = mem0_service.get_all_memories(user_id)
        
        return {
            "success": True,
            "memories": memories,
            "count": len(memories)
        }
        
    except Exception as e:
        logger.error(f"Error getting memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/memories/search")
async def search_memories(data: dict = Body(...)):
    """Search memories by query"""
    try:
        query = data.get("query", "")
        user_id = data.get("user_id", "anonymous")
        limit = data.get("limit", 5)
        
        mem0_service = get_mem0_service()
        
        if not mem0_service.is_available():
            return {
                "success": False,
                "message": "Memory service not available",
                "results": []
            }
        
        results = mem0_service.search_memories(query, user_id, limit)
        
        return {
            "success": True,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error searching memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/memories/{memory_id}")
async def delete_memory(memory_id: str):
    """Delete a specific memory"""
    try:
        mem0_service = get_mem0_service()
        
        if not mem0_service.is_available():
            raise HTTPException(status_code=503, detail="Memory service not available")
        
        success = mem0_service.delete_memory(memory_id)
        
        if success:
            return {"success": True, "message": "Memory deleted"}
        else:
            raise HTTPException(status_code=404, detail="Memory not found or could not be deleted")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting memory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/memories/user/{user_id}")
async def delete_all_user_memories(user_id: str):
    """Delete all memories for a user"""
    try:
        mem0_service = get_mem0_service()
        
        if not mem0_service.is_available():
            raise HTTPException(status_code=503, detail="Memory service not available")
        
        success = mem0_service.delete_all_memories(user_id)
        
        if success:
            return {"success": True, "message": f"All memories deleted for user {user_id}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete memories")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user memories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/memories/status")
async def get_memory_status():
    """Check if memory service is available and get stats"""
    try:
        mem0_service = get_mem0_service()
        
        return {
            "available": mem0_service.is_available(),
            "provider": "Mem0 with Gemini 2.0 Flash" if mem0_service.is_available() else None,
            "vector_store": "ChromaDB" if mem0_service.is_available() else None
        }
        
    except Exception as e:
        logger.error(f"Error getting memory status: {e}")
        return {
            "available": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)