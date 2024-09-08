document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '5decac2cc20c26a4f01741da7e195f72'; 
    const searchBtn = document.getElementById('search');
    const userLocationInput = document.getElementById('userplaces');
    const converter = document.getElementById('converter');
    const mapContainer = document.getElementById('map');
    const searchForecastBtn = document.getElementById('searchForcaste');
    const startDateInput = document.getElementById('stardate');
    const endDateInput = document.getElementById('enddate');
    let unit = 'metric';
    let mapInitialized = false;
    let map;
    let weeklyForecastData; 

    converter.addEventListener('change', () => {
        unit = converter.value === 'F' ? 'imperial' : 'metric';
    });

    searchBtn.addEventListener('click', () => {
        const location = userLocationInput.value;
        if (location) {
            fetchWeatherData(location);
        }
    });

    searchForecastBtn.addEventListener('click', () => {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        if (weeklyForecastData && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            updateWeeklyForecast(weeklyForecastData, startDate, endDate);
        } else {
            console.error('Invalid date range or weekly forecast data not available.');
        }
    });

    function fetchWeatherData(location) {
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=${unit}&appid=${apiKey}`;
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.coord) {
                    updateCurrentWeather(data);
                    displayMap(data.coord.lat, data.coord.lon);
                    fetchWeeklyForecast(data.coord.lat, data.coord.lon);
                } else {
                    console.error('Weather data does not contain coordinates:', data);
                }
            })
            .catch(error => console.error('Error fetching weather data:', error));
    }

    function fetchWeeklyForecast(lat, lon) {
        const forecastApiUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=hourly,minutely&units=${unit}&appid=${apiKey}`;
        fetch(forecastApiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.daily) {
                    weeklyForecastData = data.daily; 
                    updateWeeklyForecast(weeklyForecastData, new Date(), new Date()); 
                } else {
                    console.error('Weekly forecast data does not contain daily data:', data);
                }
            })
            .catch(error => console.error('Error fetching weekly forecast:', error));
    }

    function updateCurrentWeather(data) {
        const locationElement = document.getElementById('location');
        const temperatureElement = document.querySelector('.temperature');
        const weatherDescriptionElement = document.querySelector('.description');
        const weatherIconElement = document.getElementById('weatherIcon');
        const humidityElement = document.querySelector('.HValue');
        const windSpeedElement = document.querySelector('.WValue');
        const cloudsElement = document.querySelector('.CValue');
        const uvIndexElement = document.querySelector('.UValue');
        const pressureElement = document.querySelector('.PValue');
        const sunriseElement = document.getElementById('SRValue');
        const sunsetElement = document.getElementById('SSValue');
        const timeElement = document.getElementById('time');
        const dateElement = document.getElementById('date');

        locationElement.textContent = `${data.name}, ${data.sys.country}`;
        temperatureElement.textContent = `${Math.round(data.main.temp)}°${unit === 'metric' ? 'C' : 'F'}`;
        weatherDescriptionElement.textContent = data.weather[0].description;
        weatherIconElement.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

        humidityElement.textContent = `${data.main.humidity}%`;
        windSpeedElement.textContent = `${Math.round(data.wind.speed)} ${unit === 'metric' ? 'm/s' : 'mph'}`;
        cloudsElement.textContent = `${data.clouds.all}%`;
        pressureElement.textContent = `${data.main.pressure} hPa`;

        const sunrise = new Date(data.sys.sunrise * 1000);
        const sunset = new Date(data.sys.sunset * 1000);
        sunriseElement.textContent = sunrise.toLocaleTimeString();
        sunsetElement.textContent = sunset.toLocaleTimeString();

        const currentDate = new Date();
        timeElement.textContent = currentDate.toLocaleTimeString();
        dateElement.textContent = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

        fetchUVIndex(data.coord.lat, data.coord.lon);
    }

    function fetchUVIndex(lat, lon) {
        const uvApiUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        fetch(uvApiUrl)
            .then(response => response.json())
            .then(data => {
                const uvIndexElement = document.querySelector('.UValue');
                uvIndexElement.textContent = data.value;
            })
            .catch(error => console.error('Error fetching UV index:', error));
    }

    function displayMap(lat, lon) {
        if (!mapInitialized) {
            map = L.map(mapContainer).setView([lat, lon], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            mapInitialized = true;
        } else {
            map.setView([lat, lon], 10);
        }
        
        L.marker([lat, lon]).addTo(map)
            .bindPopup(`Location: ${userLocationInput.value}`)
            .openPopup();
    }

    function updateWeeklyForecast(dailyData, startDate, endDate) {
        const forecastContainer = document.querySelector('.forecast-container');
        forecastContainer.innerHTML = ''; 

        dailyData.forEach(day => {
            const dayDate = new Date(day.dt * 1000);
            if (dayDate >= startDate && dayDate <= endDate) {
                const card = document.createElement('div');
                card.className = 'weather-card';

                const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
                const weatherIcon = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
                const weatherDescription = day.weather[0].description;
                const temp = Math.round(day.temp.day);

                card.innerHTML = `
                    <h3>${dayName}</h3>
                    <img src="${weatherIcon}" alt="Weather Icon">
                    <p>${weatherDescription}</p>
                    <p class="temp">${temp}°${unit === 'metric' ? 'C' : 'F'}</p>
                `;

                forecastContainer.appendChild(card);
            }
        });
    }
});
