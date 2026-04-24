# Irodx - Weather & Time App

A sleek, responsive web application that provides real-time weather data and local time information for any city worldwide. The app features a modern glass-morphism UI, recent search history, caching for offline support, and live updating clocks.

**Live Demo:** [https://www.aitinc.site/nowterra.html](https://www.aitinc.site/nowterra.html)  
*Note: The live demo connects to a backend configured with API keys. To run your own instance, follow the setup instructions below.*

## Features

- 🌍 **Global Weather** – Temperature, humidity, wind speed, min/max, and condition description.
- 🕒 **Local Time** – Real‑time digital clock and date for the selected city.
- 🎨 **Dynamic Background** – Gradient changes based on temperature (hot/warm/cold).
- 📱 **Fully Responsive** – Optimized for desktop, tablet, and mobile devices.
- 💾 **Smart Caching** – Caches weather/time data for 1 hour; works offline with cached data.
- 🔍 **Recent Searches** – Saves last 5 searched cities in localStorage.
- 🧩 **Fallback Timezone** – Uses TimezoneDB API if available, otherwise a built‑in city mapping.

## Tech Stack

- **Backend:** Python 3, Flask, Flask‑CORS
- **APIs:** OpenWeatherMap (Geo & Weather), TimezoneDB (optional)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Glassmorphism design)
- **External Libraries:** `requests`, `pytz`, `python-dotenv`

## Prerequisites

- Python 3.8 or higher
- A free API key from [OpenWeatherMap](https://openweathermap.org/api) (required)
- (Optional) A free API key from [TimezoneDB](https://timezonedb.com/) – improves timezone accuracy

## Installation

1. **Clone or download** this repository to your local machine.

2. **Navigate to the project directory** and create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate