// API Configuration
const API_KEY = 'b107a4d9492a3333641b70433c0e79e1'; // Replace with your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const REVERSE_GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0/reverse';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const weatherCard = document.getElementById('weatherCard');

// Create suggestions container
const suggestionsContainer = document.createElement('div');
suggestionsContainer.className = 'absolute z-10 w-full bg-white rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto';
suggestionsContainer.style.display = 'none';
cityInput.parentElement.style.position = 'relative';
cityInput.parentElement.appendChild(suggestionsContainer);

// Weather Card Elements
const cityName = document.getElementById('cityName');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const weatherCondition = document.getElementById('weatherCondition');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
locationBtn.addEventListener('click', handleLocationClick);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Add input event listener for suggestions
let debounceTimer;
cityInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    debounceTimer = setTimeout(() => {
        fetchCitySuggestions(query);
    }, 300);
});

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.style.display = 'none';
    }
});

// Location Functions
async function handleLocationClick() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    try {
        showLoading();
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        // Get city name from coordinates
        const cityData = await getCityFromCoords(latitude, longitude);
        if (cityData) {
            cityInput.value = `${cityData.name}, ${cityData.country}`;
            const weatherData = await fetchWeatherData(`${cityData.name},${cityData.country}`);
            displayWeatherData(weatherData);
        }
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    });
}

async function getCityFromCoords(lat, lon) {
    try {
        const url = `${REVERSE_GEOCODING_URL}?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to get city name');
        }

        const data = await response.json();
        return data[0];
    } catch (error) {
        throw new Error('Failed to get city name from coordinates');
    }
}

// Main Functions
async function handleSearch() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    try {
        showLoading();
        const weatherData = await fetchWeatherData(city);
        displayWeatherData(weatherData);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function fetchCitySuggestions(query) {
    try {
        const url = `${GEOCODING_URL}?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        displaySuggestions(data);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

function displaySuggestions(cities) {
    if (cities.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    suggestionsContainer.innerHTML = '';
    cities.forEach(city => {
        const div = document.createElement('div');
        div.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer';
        div.textContent = `${city.name}, ${city.country}`;
        div.addEventListener('click', () => {
            cityInput.value = `${city.name}, ${city.country}`;
            suggestionsContainer.style.display = 'none';
            handleSearch();
        });
        suggestionsContainer.appendChild(div);
    });
    suggestionsContainer.style.display = 'block';
}

async function fetchWeatherData(city) {
    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('City not found');
        }
        throw new Error('Failed to fetch weather data');
    }

    return await response.json();
}

function displayWeatherData(data) {
    // Update weather card with data
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    weatherCondition.textContent = data.weather[0].main;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} m/s`;
    
    // Update weather icon
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    // Show the weather card
    weatherCard.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

// UI Helper Functions
function showLoading() {
    loadingSpinner.classList.remove('hidden');
    weatherCard.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showError(message) {
    errorMessage.classList.remove('hidden');
    errorMessage.querySelector('p').textContent = message;
    weatherCard.classList.add('hidden');
} 