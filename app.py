import os
import requests
import pytz
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow all origins (for development)

# API keys from .env
OPENWEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
TIMEZONEDB_API_KEY = os.getenv("TIME_API_KEY")

if not OPENWEATHER_API_KEY:
    raise ValueError("Missing WEATHER_API_KEY in .env")

# Fallback timezone mapping (used if TimezoneDB fails or not provided)
CITY_TZ_MAP = {
    "new york": "America/New_York",
    "london": "Europe/London",
    "paris": "Europe/Paris",
    "tokyo": "Asia/Tokyo",
    "sydney": "Australia/Sydney",
    "moscow": "Europe/Moscow",
    "beijing": "Asia/Shanghai",
    "delhi": "Asia/Kolkata",
    "dubai": "Asia/Dubai",
    "singapore": "Asia/Singapore",
    "los angeles": "America/Los_Angeles",
    "chicago": "America/Chicago",
    "toronto": "America/Toronto",
    "berlin": "Europe/Berlin",
    "rome": "Europe/Rome",
    "mumbai": "Asia/Kolkata"
}

def get_coordinates(city_name):
    """Get lat/lon from OpenWeatherMap Geocoding API."""
    url = "http://api.openweathermap.org/geo/1.0/direct"
    params = {"q": city_name, "limit": 1, "appid": OPENWEATHER_API_KEY}
    resp = requests.get(url, params=params)
    if resp.status_code != 200 or not resp.json():
        return None, None
    data = resp.json()[0]
    return data.get("lat"), data.get("lon")

def get_timezone(lat, lon, city_name):
    """Get timezone name using TimezoneDB (if key provided) or fallback."""
    if TIMEZONEDB_API_KEY:
        url = "http://api.timezonedb.com/v2.1/get-time-zone"
        params = {
            "key": TIMEZONEDB_API_KEY,
            "format": "json",
            "by": "position",
            "lat": lat,
            "lng": lon
        }
        try:
            resp = requests.get(url, params=params, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "OK":
                    return data.get("zoneName")
        except Exception:
            pass  # fallback

    # Fallback: use city name mapping
    city_lower = city_name.lower()
    for key, tz in CITY_TZ_MAP.items():
        if key in city_lower:
            return tz
    return "UTC"

@app.route('/api/weather-time', methods=['GET'])
def weather_time():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City parameter required"}), 400

    # 1. Get coordinates
    lat, lon = get_coordinates(city)
    if lat is None:
        return jsonify({"error": "City not found"}), 404

    # 2. Get weather
    weather_url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric"
    }
    weather_resp = requests.get(weather_url, params=params)
    if weather_resp.status_code != 200:
        return jsonify({"error": "Weather data unavailable"}), 502
    weather_data = weather_resp.json()

    # 3. Get timezone
    tz_name = get_timezone(lat, lon, city)
    try:
        tz = pytz.timezone(tz_name)
        now = datetime.now(tz)
        timestamp = now.timestamp()
    except Exception:
        tz_name = "UTC"
        now = datetime.now(pytz.UTC)
        timestamp = now.timestamp()

    return jsonify({
        "weather": weather_data,
        "time": {
            "zoneName": tz_name,
            "timestamp": timestamp
        }
    })

# Serve the frontend HTML file at root
@app.route('/')
def index():
    return send_from_directory('.', 'nowterra.html')

# Serve the CSS file (must be present in the same directory)
@app.route('/main.css')
def serve_css():
    return send_from_directory('.', 'main.css', mimetype='text/css')

if __name__ == '__main__':
    app.run(debug=True, port=5000)