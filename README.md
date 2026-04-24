# Irodx – Weather & Time

Irodx is a sleek, responsive web application that provides real-time weather conditions and local time for any city worldwide. With a clean dual-panel interface, it offers instant search, recent search history, offline caching, and touch-friendly interactions—perfect for both desktop and mobile use.

![Weather App Demo](https://www.aitinc.site/nowterra.html)

## ✨ Features

- **Real-time Weather Data** – Temperature (current, min/max, feels like), humidity, wind speed, and condition description.
- **Local Time Display** – Accurate timezone-based local time and date for the searched city.
- **City Search** – Search by city name (e.g., Dhaka, Tokyo, London).
- **Recent Searches** – Last 5 searches saved locally for quick access.
- **Smart Caching** – Weather data is cached for 1 hour, reducing API calls and enabling offline fallback.
- **Responsive Design** – Optimized for both desktop (side-by-side panels) and mobile (vertical stacked panels).
- **Touch Gestures** – Swipe up on weather results to scroll (mobile) and animated button feedback.
- **Error Handling** – User-friendly messages for invalid cities or network issues.

## 🛠️ Tech Stack

- **HTML5** – Semantic structure
- **CSS3** – Custom styles + Tailwind CSS (CDN) for utility classes
- **JavaScript (ES6+)** – Async API calls, DOM manipulation, local storage
- **APIs**:
  - [OpenWeatherMap](https://openweathermap.org/api) – Current weather data
  - [TimeZoneDB](https://timezonedb.com/api) – Local time by coordinates
- **Icons** – Font Awesome 6.4.0
- **Fonts** – Google Fonts (Poppins)

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- API keys from OpenWeatherMap and TimeZoneDB (free tiers available)
