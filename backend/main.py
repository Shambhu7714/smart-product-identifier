import os
import sqlite3
import json
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-pro-preview")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not set")

genai.configure(api_key=GEMINI_API_KEY)

# Database
def init_db():
    conn = sqlite3.connect("products.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_name TEXT,
            upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            products TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

# Gemini prompt
DETECTION_PROMPT = """
        You are a retail product detection AI. Analyze this image of a retail store (like Big Bazaar, Reliance, supermarket, electronics store).

        Identify all visible products in the image. Products can be:
        - Mobile phones (Samsung, iPhone, OnePlus, etc.)
        - Tablets and laptops
        - Snacks and chips (Lays, Kurkure, Bingo, etc.)
        - Beverages (Coca Cola, Pepsi, etc.)
        - Any other consumer products

        IMPORTANT INSTRUCTIONS:
        1. Give SEPARATE entries for each distinct product or model
        2. Do NOT combine multiple models into one entry
        3. If you see "Vivo Y series" and "Vivo V series", list them separately with individual percentages
        4. If you see "iPhone 13", "iPhone 14", "iPhone 15", list each one separately
        5. Be as specific as possible with product names
        6. **CRITICAL: The sum of ALL percentages MUST equal 100%** (this represents the entire visible shelf/display space)

        For each product you can identify, estimate its visual prominence/percentage in the image.
        The percentages should represent the proportion of total visible shelf/display space.

        Return ONLY a valid JSON array with this exact format:
        [
            {"product_name": "Product Name ", "percentage": 15.5},
            {"product_name": "Product name ", "percentage": 12.0},
            {"product_name": "Product Name ", "percentage": 18.5},
            {"product_name": "Product Name ", "percentage": 10.0},
            {"product_name": "Product Name ", "percentage": 14.0},
            {"product_name": "Product Name ", "percentage": 16.0},
            {"product_name": "Other products", "percentage": 14.0}
        ]

        **Note: In the example above, total = 15.5 + 12.0 + 18.5 + 10.0 + 14.0 + 16.0 + 14.0 = 100.0%**

        Rules:
        - Return ONLY the JSON array, no other text
        - Each product should be a SEPARATE entry, not combined
        - **The sum of all percentages MUST equal 100%**
        - If you cannot identify any products clearly, return: []
        - Percentage represents proportion of total visible space (0-100)
        - Be specific with product names when brands/models are visible
        - If there are unclear or generic products, include them as "Generic products" or "Other products" to make total 100%
        """

# Detect products function
async def detect_products_with_gemini(image_bytes: bytes, filename: str):
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        response = model.generate_content([
            DETECTION_PROMPT,
            {
                "mime_type": "image/jpeg",
                "data": image_bytes
            }
        ])
        
        text = response.text.strip()
        # Clean response
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        text = text.strip()
        
        products = json.loads(text)
        print(f"Gemini Raw Response: {products}")
        if not isinstance(products, list):
            return []
        
        # Normalize percentages to total 100%
        products = normalize_percentages(products)
        print(f"Gemini Normalized Products: {products}")
        return products
        
    except Exception as e:
        print(f"Gemini Error: {str(e)}")
        return []

def normalize_percentages(products):
    """Ensure all product percentages add up to 100%"""
    if not products:
        return products
    
    # Calculate current total
    total = sum(p.get('percentage', 0) for p in products)
    
    if total == 0:
        return products
    
    # If total is not 100%, normalize all percentages
    if abs(total - 100.0) > 0.1:  # Allow small floating point differences
        normalization_factor = 100.0 / total
        for product in products:
            product['percentage'] = round(product['percentage'] * normalization_factor, 1)
        
        print(f"Normalized percentages from {total}% to 100%")
    
    return products

# API Routes
@app.post("/api/detect")
async def detect_products(file: UploadFile = File(...)):
    try:
        # Read image
        image_bytes = await file.read()
        
        # Detect with Gemini
        products = await detect_products_with_gemini(image_bytes, file.filename)
        
        # Save to database
        conn = sqlite3.connect("products.db")
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO detections (image_name, products) VALUES (?, ?)",
            (file.filename, json.dumps(products))
        )
        conn.commit()
        conn.close()
        
        return JSONResponse({
            "success": True,
            "image_name": file.filename,
            "products": products,
            "upload_time": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
async def get_history():
    try:
        conn = sqlite3.connect("products.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT image_name, upload_time, products 
            FROM detections 
            ORDER BY upload_time DESC 
            LIMIT 50
        """)
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                "image_name": row[0],
                "upload_time": row[1],
                "products": json.loads(row[2])
            })
        
        return JSONResponse({"success": True, "data": history})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount frontend static files (must be last)
app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


