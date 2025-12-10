
        // API Keys
        const WEATHER_API_KEY = 'f9f2972513c8c2416a019f5c7f102dcd';
        const TIME_API_KEY = 'YS9TY9BKOBGV';
        
        // DOM Elements
        const cityInput = document.getElementById('cityInput');
        const searchBtn = document.getElementById('searchBtn');
        const resultDiv = document.getElementById('result');
        const recentSearchesDiv = document.getElementById('recentSearches');
        
        // Variables for swipe detection
        let startY = 0;
        let endY = 0;
        
        // Event Listeners
        searchBtn.addEventListener('click', searchWeather);
        searchBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 10px rgba(255, 107, 107, 0.3)';
        });
        searchBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.style.transform = '';
            this.style.boxShadow = '';
            searchWeather();
        });
        
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchBtn.click();
        });
        
        // Touch events for swipe detection
        resultDiv.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        resultDiv.addEventListener('touchmove', (e) => {
            endY = e.touches[0].clientY;
        });
        
        resultDiv.addEventListener('touchend', () => {
            if (startY - endY > 50) { // Swipe up
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        });
        
        // Initialize with a default city and load recent searches
        window.addEventListener('load', () => {
            loadRecentSearches();
            const cachedData = getCachedWeatherData();
            if (cachedData) {
                displayResults(cachedData.weather, cachedData.time);
            } else {
                getWeatherAndTimeData('New York');
            }
        });
        
        // Save recent searches to localStorage
        function saveToRecentSearches(city) {
            let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
            
            // Remove if already exists
            recentSearches = recentSearches.filter(item => item !== city);
            
            // Add to beginning
            recentSearches.unshift(city);
            
            // Keep only last 5 searches
            if (recentSearches.length > 5) {
                recentSearches = recentSearches.slice(0, 5);
            }
            
            localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
            loadRecentSearches();
        }
        
        function loadRecentSearches() {
            const recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
            recentSearchesDiv.innerHTML = '';
            
            if (recentSearches.length > 0) {
                recentSearches.forEach(city => {
                    const btn = document.createElement('button');
                    btn.className = 'recent-btn';
                    btn.textContent = city;
                    btn.addEventListener('click', () => {
                        cityInput.value = city;
                        getWeatherAndTimeData(city);
                    });
                    btn.addEventListener('touchstart', () => {
                        btn.style.transform = 'scale(0.95)';
                    });
                    btn.addEventListener('touchend', () => {
                        btn.style.transform = '';
                    });
                    recentSearchesDiv.appendChild(btn);
                });
            }
        }
        
        function searchWeather() {
            const city = cityInput.value.trim();
            if (city) {
                showLoading();
                getWeatherAndTimeData(city);
            }
        }
        
        function showLoading() {
            resultDiv.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">Fetching weather data...</p>
                </div>
            `;
        }
        
        function cacheWeatherData(weatherData, timeData) {
            const dataToCache = {
                weather: weatherData,
                time: timeData,
                timestamp: new Date().getTime()
            };
            localStorage.setItem('cachedWeatherData', JSON.stringify(dataToCache));
        }
        
        function getCachedWeatherData() {
            const cachedData = localStorage.getItem('cachedWeatherData');
            if (!cachedData) return null;
            
            const parsedData = JSON.parse(cachedData);
            const now = new Date().getTime();
            const oneHour = 60 * 60 * 1000;
            
            // Return cached data if it's less than 1 hour old
            if (now - parsedData.timestamp < oneHour) {
                return parsedData;
            }
            
            return null;
        }
        
        async function getWeatherAndTimeData(city) {
            try {
                // Get weather data
                const weatherResponse = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
                );
                const weatherData = await weatherResponse.json();
                
                if (weatherData.cod !== 200) {
                    showError(weatherData.message || 'City not found!');
                    return;
                }
                
                // Get time data
                const lat = weatherData.coord.lat;
                const lon = weatherData.coord.lon;
                
                const timeResponse = await fetch(
                    `https://api.timezonedb.com/v2.1/get-time-zone?key=${TIME_API_KEY}&format=json&by=position&lat=${lat}&lng=${lon}`
                );
                const timeData = await timeResponse.json();
                
                if (timeData.status !== "OK") {
                    showError('Could not retrieve time data');
                    return;
                }
                
                // Save to cache and recent searches
                cacheWeatherData(weatherData, timeData);
                saveToRecentSearches(city);
                
                // Display results
                displayResults(weatherData, timeData);
                
            } catch (error) {
                // Try to use cached data if available
                const cachedData = getCachedWeatherData();
                if (cachedData) {
                    displayResults(cachedData.weather, cachedData.time);
                    showError('Network error. Showing cached data.');
                } else {
                    showError('Network error. Please check your connection and try again.');
                }
                console.error("Error:", error);
            }
        }
        
        function displayResults(weatherData, timeData) {
            const localTime = new Date(timeData.formatted);
            
            // Weather icon mapping
            const iconMap = {
                '01d': 'fas fa-sun',
                '01n': 'fas fa-moon',
                '02d': 'fas fa-cloud-sun',
                '02n': 'fas fa-cloud-moon',
                '03d': 'fas fa-cloud',
                '03n': 'fas fa-cloud',
                '04d': 'fas fa-cloud',
                '04n': 'fas fa-cloud',
                '09d': 'fas fa-cloud-showers-heavy',
                '09n': 'fas fa-cloud-showers-heavy',
                '10d': 'fas fa-cloud-sun-rain',
                '10n': 'fas fa-cloud-moon-rain',
                '11d': 'fas fa-bolt',
                '11n': 'fas fa-bolt',
                '13d': 'fas fa-snowflake',
                '13n': 'fas fa-snowflake',
                '50d': 'fas fa-smog',
                '50n': 'fas fa-smog'
            };
            
            const weatherIcon = iconMap[weatherData.weather[0].icon] || 'fas fa-cloud';
            
            // Format time
            const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            
            const resultHTML = `
                <div class="weather-info">
                    <div class="weather-header">
                        <div>
                            <h2>${weatherData.name}, ${weatherData.sys.country}</h2>
                            <p>${weatherData.weather[0].description}</p>
                        </div>
                        <div class="weather-icon">
                            <i class="${weatherIcon}"></i>
                        </div>
                    </div>
                    
                    <div class="temp-display">
                        <p style="font-size: 2.8rem; font-weight: 700; margin: 0.5rem 0;">${Math.round(weatherData.main.temp)}°C</p>
                        <p>Feels like: ${Math.round(weatherData.main.feels_like)}°C</p>
                    </div>
                    
                    <div class="weather-details">
                        <div class="detail-item">
                            <i class="fas fa-temperature-low"></i>
                            <div class="detail-info">
                                <p>Min Temp</p>
                                <p><strong>${Math.round(weatherData.main.temp_min)}°C</strong></p>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-temperature-high"></i>
                            <div class="detail-info">
                                <p>Max Temp</p>
                                <p><strong>${Math.round(weatherData.main.temp_max)}°C</strong></p>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-tint"></i>
                            <div class="detail-info">
                                <p>Humidity</p>
                                <p><strong>${weatherData.main.humidity}%</strong></p>
                            </div>
                        </div>
                        
                        <div class="detail-item">
                            <i class="fas fa-wind"></i>
                            <div class="detail-info">
                                <p>Wind</p>
                                <p><strong>${weatherData.wind.speed} m/s</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="time-info">
                    <h3><i class="fas fa-clock"></i> Local Time</h3>
                    <div class="time-display">${localTime.toLocaleTimeString('en-US', timeOptions)}</div>
                    <div class="date-display">${localTime.toLocaleDateString('en-US', dateOptions)}</div>
                    <p><strong>Timezone:</strong> ${timeData.zoneName}</p>
                </div>
            `;
            
            resultDiv.innerHTML = resultHTML;
            
            // Auto-scroll to top of results for better mobile view
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        function showError(message) {
            resultDiv.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i> ${message}
                </div>
                <p style="margin-top: 1.5rem; text-align: center;">
                    <i class="fas fa-lightbulb"></i> Tip: Try entering a major city name
                </p>
            `;
        }