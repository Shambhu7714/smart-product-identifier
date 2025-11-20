# Retail Product Detection System

AI-powered product detection using Gemini Vision API.

## Project Structure

```
retail-product-detection/
├── backend/
│   ├── main.py              # FastAPI backend
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment template
│   ├── .env                 # Your API key (create this)
│   └── products.db          # SQLite database (auto-created)
│
└── frontend/
    ├── index.html           # Main HTML page
    ├── style.css            # Styles
    └── script.js            # JavaScript logic
```

## Setup

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Add your Gemini API key to .env
# GEMINI_API_KEY=your_actual_key
```

Get API key: https://makersuite.google.com/app/apikey

### 2. Run Backend

```bash
cd backend
python main.py
```

Backend runs on: `http://localhost:8000`

### 3. Access Frontend

Open browser: `http://localhost:8000`

## Features

- Upload retail store images (Big Bazaar, Reliance, etc.)
- AI detects products using Gemini Vision
- Shows product names and percentage
- Stores detections in SQLite database
- Clean separated frontend/backend

## API Endpoints

- `POST /api/detect` - Upload image for detection
- `GET /api/history` - Get detection history

## How It Works

1. **Frontend**: User uploads image via HTML interface
2. **Backend**: Sends image to Gemini Vision API with prompt
3. **Gemini**: Analyzes image and returns products with percentages
4. **Database**: Saves detection results in SQLite
5. **Frontend**: Displays products in cards with percentages

## Detected Products

- Mobile phones (Samsung, iPhone, OnePlus, etc.)
- Tablets and laptops
- Snacks (Lays, Kurkure, Bingo, etc.)
- Beverages (Coca Cola, Pepsi, etc.)
- Any consumer products

## Database Schema

```sql
CREATE TABLE detections (
    id INTEGER PRIMARY KEY,
    image_name TEXT,
    upload_time TIMESTAMP,
    products TEXT  -- JSON format
);
```