
        (function() {
            // ----------------------------- DOM element creation helpers -----------------------------
            function createElement(tag, className, attributes = {}, children = []) {
                const el = document.createElement(tag);
                if (className) el.className = className;
                for (let [key, value] of Object.entries(attributes)) {
                    if (key === 'innerHTML') el.innerHTML = value;
                    else if (key === 'textContent') el.textContent = value;
                    else el.setAttribute(key, value);
                }
                children.forEach(child => {
                    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
                    else el.appendChild(child);
                });
                return el;
            }

            // ----------------------------- State & Cache -----------------------------
            let currentWeatherData = null;
            let currentTimeData = null;
            let liveClockInterval = null;
            let isLoading = false;
            let errorMessage = null;
            let recentSearchesList = [];
            let cityInputValue = '';
            let isMobile = window.innerWidth <= 768;
            let gradientStyle = 'linear-gradient(135deg, #e0e5ec 0%, #f0f2f5 100%)';

            // DOM elements references (to be populated after render)
            let rootEl, resultContainer, weatherContentEl, cityInputEl, recentContainer, bgGradientEl;

            // Icon mapping (emoji/text fallback because FontAwesome removed)
            const iconMap = {
                '01d': '☀️', '01n': '🌙',
                '02d': '⛅', '02n': '☁️',
                '03d': '☁️', '03n': '☁️',
                '04d': '☁️', '04n': '☁️',
                '09d': '🌧️', '09n': '🌧️',
                '10d': '🌦️', '10n': '🌧️',
                '11d': '⛈️', '11n': '⛈️',
                '13d': '❄️', '13n': '❄️',
                '50d': '🌫️', '50n': '🌫️'
            };
            const defaultIcon = '🌥️';

            // ----------------------------- Helper Functions (original logic) -----------------------------
            function saveToRecentSearches(city) {
                let recent = JSON.parse(localStorage.getItem('recentSearches')) || [];
                recent = recent.filter(item => item.toLowerCase() !== city.toLowerCase());
                recent.unshift(city);
                if (recent.length > 5) recent = recent.slice(0, 5);
                localStorage.setItem('recentSearches', JSON.stringify(recent));
                recentSearchesList = recent;
                renderRecentButtons();
            }

            function loadRecentSearches() {
                const recent = JSON.parse(localStorage.getItem('recentSearches')) || [];
                recentSearchesList = recent;
                renderRecentButtons();
            }

            function cacheWeatherData(weather, time) {
                const dataToCache = { weather, time, timestamp: new Date().getTime() };
                localStorage.setItem('cachedWeatherData', JSON.stringify(dataToCache));
            }

            function getCachedWeatherData() {
                const cachedData = localStorage.getItem('cachedWeatherData');
                if (!cachedData) return null;
                const parsedData = JSON.parse(cachedData);
                const now = new Date().getTime();
                if (now - parsedData.timestamp < 3600000) return parsedData;
                return null;
            }

            function showError(msg) {
                if (liveClockInterval) clearInterval(liveClockInterval);
                errorMessage = msg;
                currentWeatherData = null;
                currentTimeData = null;
                isLoading = false;
                renderResultContent();
            }

            function displayResults(weather, time) {
                if (liveClockInterval) clearInterval(liveClockInterval);
                const temp = Math.round(weather.main.temp);
                let bgColor1 = '#e0e5ec', bgColor2 = '#f0f2f5';
                if (temp > 30) { bgColor1 = '#fff3e0'; bgColor2 = '#ffe0b2'; }
                else if (temp < 15) { bgColor1 = '#e3f2fd'; bgColor2 = '#bbdefb'; }
                
                if (isMobile) {
                    document.body.style.backgroundColor = bgColor1;
                    gradientStyle = `linear-gradient(135deg, ${bgColor1} 0%, ${bgColor2} 100%)`;
                } else {
                    document.body.style.backgroundColor = '';
                    gradientStyle = `linear-gradient(135deg, ${bgColor1} 0%, ${bgColor2} 100%)`;
                }
                if (bgGradientEl) bgGradientEl.style.background = gradientStyle;
                
                if (weatherContentEl) {
                    weatherContentEl.style.animation = 'none';
                    weatherContentEl.offsetHeight;
                    weatherContentEl.style.animation = 'fadeInUp 0.6s forwards';
                }
                
                currentWeatherData = weather;
                currentTimeData = time;
                errorMessage = null;
                isLoading = false;
                renderResultContent();
                startLiveClock(time.zoneName);
            }

            async function getWeatherAndTimeData(city) {
                isLoading = true;
                errorMessage = null;
                renderResultContent();
                try {
                    const response = await fetch(`/api/weather-time?city=${encodeURIComponent(city)}`);
                    const responseText = await response.text();
                    if (!response.ok) {
                        let errorMsgText = `Server error: ${response.status}`;
                        if (response.headers.get('content-type')?.includes('application/json')) {
                            try {
                                const errorData = JSON.parse(responseText);
                                errorMsgText = errorData.error || errorMsgText;
                            } catch(e) {}
                        } else {
                            if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
                                errorMsgText = "Backend returned HTML. Make sure Flask is running on port 5000.";
                            } else {
                                errorMsgText = responseText.substring(0, 200);
                            }
                        }
                        throw new Error(errorMsgText);
                    }
                    let data;
                    try {
                        data = JSON.parse(responseText);
                    } catch(e) {
                        throw new Error('Invalid JSON from server');
                    }
                    if (!data.weather || !data.time || !data.time.zoneName) {
                        throw new Error('Incomplete data received');
                    }
                    cacheWeatherData(data.weather, data.time);
                    saveToRecentSearches(data.weather.name);
                    displayResults(data.weather, data.time);
                } catch (error) {
                    console.error(error);
                    const cachedData = getCachedWeatherData();
                    if (cachedData) {
                        displayResults(cachedData.weather, cachedData.time);
                        showError('Offline mode: Showing cached data.<br>' + error.message);
                    } else {
                        showError(error.message);
                    }
                }
            }

            function startLiveClock(timezone) {
                function updateClock() {
                    const now = new Date();
                    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: timezone };
                    const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', timeZone: timezone };
                    const timeEl = document.getElementById('live-time');
                    const dateEl = document.getElementById('live-date');
                    if (timeEl) timeEl.innerText = now.toLocaleTimeString('en-US', timeOptions);
                    if (dateEl) dateEl.innerText = now.toLocaleDateString('en-US', dateOptions);
                }
                updateClock();
                if (liveClockInterval) clearInterval(liveClockInterval);
                liveClockInterval = setInterval(updateClock, 1000);
            }

            // ----------------------------- Rendering Functions (all DOM built with JS) -----------------------------
            function renderRecentButtons() {
                if (!recentContainer) return;
                recentContainer.innerHTML = '';
                recentSearchesList.forEach(city => {
                    const btn = createElement('button', 'recent-btn', { textContent: city });
                    btn.addEventListener('click', () => {
                        cityInputEl.value = city;
                        cityInputValue = city;
                        getWeatherAndTimeData(city);
                    });
                    recentContainer.appendChild(btn);
                });
            }

            function renderResultContent() {
                if (!resultContainer) return;
                resultContainer.innerHTML = '';
                if (isLoading) {
                    const loadingDiv = createElement('div', 'loading', {}, [
                        createElement('div', 'loading-spinner'),
                        createElement('p', '', { textContent: 'Fetching data...' })
                    ]);
                    resultContainer.appendChild(loadingDiv);
                    return;
                }
                if (errorMessage) {
                    const errorDiv = createElement('div', 'error', { innerHTML: `<span>⚠️ ${errorMessage}</span>` });
                    resultContainer.appendChild(errorDiv);
                    return;
                }
                if (currentWeatherData && currentTimeData) {
                    const temp = Math.round(currentWeatherData.main.temp);
                    const feelsLike = Math.round(currentWeatherData.main.feels_like);
                    const iconCode = currentWeatherData.weather[0].icon;
                    const iconChar = iconMap[iconCode] || defaultIcon;
                    
                    // Weather card
                    const weatherCard = createElement('div', 'glass-card');
                    const header = createElement('div', 'weather-header');
                    const titleDiv = createElement('div', '', {}, [
                        createElement('h2', '', { textContent: currentWeatherData.name }),
                        createElement('p', '', { textContent: currentWeatherData.weather[0].description })
                    ]);
                    const iconDiv = createElement('div', 'weather-icon', { textContent: iconChar });
                    header.appendChild(titleDiv);
                    header.appendChild(iconDiv);
                    
                    const tempDiv = createElement('div', 'temp-display', { textContent: `${temp}°C` });
                    const feelsDiv = createElement('div', 'temp-sub', { textContent: `Feels like ${feelsLike}°C` });
                    
                    const detailsGrid = createElement('div', 'weather-details');
                    const details = [
                        { icon: '💧', label: 'Humidity', value: `${currentWeatherData.main.humidity}%` },
                        { icon: '💨', label: 'Wind', value: `${currentWeatherData.wind.speed} m/s` },
                        { icon: '🌡️', label: 'Min', value: `${Math.round(currentWeatherData.main.temp_min)}°` },
                        { icon: '🌡️', label: 'Max', value: `${Math.round(currentWeatherData.main.temp_max)}°` }
                    ];
                    details.forEach(d => {
                        const item = createElement('div', 'detail-item');
                        const iconSpan = createElement('div', 'detail-icon', { textContent: d.icon });
                        const infoDiv = createElement('div', 'detail-info', {}, [
                            createElement('p', '', { textContent: d.label }),
                            createElement('p', '', { textContent: d.value })
                        ]);
                        item.appendChild(iconSpan);
                        item.appendChild(infoDiv);
                        detailsGrid.appendChild(item);
                    });
                    
                    weatherCard.appendChild(header);
                    weatherCard.appendChild(tempDiv);
                    weatherCard.appendChild(feelsDiv);
                    weatherCard.appendChild(detailsGrid);
                    
                    // Time card
                    const timeCard = createElement('div', 'glass-card time-info');
                    const timeTitle = createElement('h3', '', {}, [ '🕒 ', createElement('span', '', { textContent: 'Local Time' }) ]);
                    const timeDisplay = createElement('div', 'time-display', { id: 'live-time', textContent: '--:--:-- --' });
                    const dateDisplay = createElement('div', 'date-display', { id: 'live-date', textContent: 'Loading...' });
                    timeCard.appendChild(timeTitle);
                    timeCard.appendChild(timeDisplay);
                    timeCard.appendChild(dateDisplay);
                    
                    resultContainer.appendChild(weatherCard);
                    resultContainer.appendChild(timeCard);
                } else {
                    const emptyDiv = createElement('div', 'loading', {}, [
                        createElement('div', 'loading-spinner'),
                        createElement('p', '', { textContent: 'Enter a city name to get started' })
                    ]);
                    resultContainer.appendChild(emptyDiv);
                }
            }

            function renderFullUI() {
                // Clear root
                rootEl.innerHTML = '';
                // Background gradient
                bgGradientEl = createElement('div', 'bg-gradient');
                bgGradientEl.style.background = gradientStyle;
                rootEl.appendChild(bgGradientEl);
                
                const fullContainer = createElement('div', 'fullscreen-container');
                
                // Search Panel
                const searchPanel = createElement('div', 'search-panel');
                const branding = createElement('div', 'branding');
                const brandH1 = createElement('h1', '', {}, [
                    createElement('span', '', { textContent: '🌍' }),
                    createElement('span', '', { textContent: ' Irodx' })
                ]);
                const brandP = createElement('p', '', { textContent: 'Weather & Time for any city' });
                branding.appendChild(brandH1);
                branding.appendChild(brandP);
                
                const searchContainer = createElement('div', 'search-container');
                const searchBox = createElement('div', 'search-box');
                cityInputEl = createElement('input', 'city-input', { type: 'text', placeholder: 'Enter city name...', value: cityInputValue });
                const searchBtn = createElement('button', 'search-btn', {}, [ '🔍 ', createElement('span', '', { textContent: 'Search' }) ]);
                searchBtn.addEventListener('click', () => {
                    const city = cityInputEl.value.trim();
                    if (city) getWeatherAndTimeData(city);
                });
                cityInputEl.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') searchBtn.click();
                });
                searchBox.appendChild(cityInputEl);
                searchBox.appendChild(searchBtn);
                
                recentContainer = createElement('div', 'recent-searches');
                searchContainer.appendChild(searchBox);
                searchContainer.appendChild(recentContainer);
                searchPanel.appendChild(branding);
                searchPanel.appendChild(searchContainer);
                
                // Results Panel
                const resultsPanel = createElement('div', 'results-panel');
                weatherContentEl = createElement('div', 'weather-content');
                resultContainer = createElement('div', 'result');
                weatherContentEl.appendChild(resultContainer);
                resultsPanel.appendChild(weatherContentEl);
                
                fullContainer.appendChild(searchPanel);
                fullContainer.appendChild(resultsPanel);
                rootEl.appendChild(fullContainer);
                
                // Bind event handlers after DOM exists
                renderRecentButtons();
                renderResultContent();
            }
            
            // ----------------------------- Initialization -----------------------------
            function init() {
                rootEl = document.getElementById('app');
                loadRecentSearches();
                renderFullUI();
                const cachedData = getCachedWeatherData();
                if (cachedData) {
                    displayResults(cachedData.weather, cachedData.time);
                } else {
                    getWeatherAndTimeData('New York');
                }
                window.addEventListener('resize', () => {
                    isMobile = window.innerWidth <= 768;
                });
            }
            
            init();
        })();
