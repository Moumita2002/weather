import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';

const WeatherApp = () => {
    const [city, setCity] = useState('');
    const [weatherData, setWeatherData] = useState(null);
    const [error, setError] = useState(null);
    const [unit, setUnit] = useState('metric'); // Default unit is Celsius
    const [recentSearches, setRecentSearches] = useState([]);
    const [showRecentSearches, setShowRecentSearches] = useState(false); 
    const [stateWeatherData, setStateWeatherData] = useState([]);
    const [hoveredState, setHoveredState] = useState(null);
    const [cityChart, setCityChart] = useState(null);

    const API_KEY = '9452de772f131926d437b5f98927c086'; 

    useEffect(() => {
        const fetchStateWeatherData = async () => {
            const stateIds = [1273294, 1275339, 1264527, 1258526, 1275004, 1275817, 1279259, 1255634];

            const responses = await Promise.all(stateIds.map(async id => {
                try {
                    const response = await axios.get(`http://api.openweathermap.org/data/2.5/group?id=${id}&appid=${API_KEY}&units=${unit}`);
                    return response.data;
                } catch (error) {
                    console.error(`Error fetching data for state ID ${id}:`, error);
                    return null;
                }
            }));

            const formattedData = responses.filter(response => response !== null).map(response => {
                const stateData = response.list.map(cityData => ({
                    name: cityData.name,
                    main: cityData.main,
                    weather: cityData.weather
                }));
                return {
                    name: response.list[0].name, // Use the first city's name as the state name
                    cities: stateData
                };
            });

            setStateWeatherData(formattedData);
        };

        fetchStateWeatherData();
    }, [unit]);

    const handleSearch = () => {
        if (city.trim() !== '') {
            fetchWeatherData();
            setShowRecentSearches(true); // Show recent searches when search button is clicked
        }
    };

    const fetchWeatherData = async () => {
        try {
            const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${unit}`);
            const { name, main, weather, wind } = response.data;
            setWeatherData(response.data);
            setError(null);
            updateRecentSearches({ name, temperature: main.temp, weather: weather[0].description, wind: wind.speed });
        } catch (error) {
            setWeatherData(null);
            setError('City not found. Please enter a valid city name.');
        }
    };

    const toggleUnit = () => {
        setUnit(unit === 'metric' ? 'imperial' : 'metric');
    };

    const updateRecentSearches = (search) => {
        const updatedSearches = [search, ...recentSearches.slice(0, 4)];
        setRecentSearches(updatedSearches);
    };

    const getTemperature = (temp) => {
        return unit === 'metric' ? temp : (temp * 9 / 5 + 32).toFixed(2);
    };

    const getTemperatureColor = (temp) => {
        const celsiusTemp = unit === 'metric' ? temp : (temp - 32) * 5 / 9;
        if (celsiusTemp > 25) {
            return 'red';
        } else if (celsiusTemp < 10) {
            return 'blue';
        } else {
            return 'white';
        }
    };

    useEffect(() => {
        if (hoveredState) {
            const ctx = document.getElementById('city-temperature-chart');
            if (ctx) {
                const cityLabels = hoveredState.cities.map(city => city.name);
                const temperatureData = hoveredState.cities.map(city => city.main.temp);

                if (cityChart) {
                    cityChart.destroy();
                }

                setCityChart(new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: cityLabels,
                        datasets: [{
                            label: 'Temperature (°C)',
                            data: temperatureData,
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Temperature (°C)'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Cities'
                                }
                            }
                        }
                    }
                }));
            }
        }
    }, [hoveredState]);

    return (
        <div className="weather-app">
            {/* Add JSX for rendering the Weather App */}
            <h1>Weather App</h1>
            <div className='info'>
                <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city name"
                />
                <button onClick={handleSearch}>Search</button>
                <button onClick={toggleUnit}>{unit === 'metric' ? '°F' : '°C'}</button>

            </div>
            {error && <div className="error">{error}</div>}
            <div className='details'>
                {weatherData && (
                    <div className="weather-info">
                        <h2>{weatherData.name}</h2>
                        <p>Temperature: <span style={{ color: getTemperatureColor(weatherData.main.temp) }}>{getTemperature(weatherData.main.temp)}</span> {unit === 'metric' ? '°C' : '°F'}</p>
                        <p>Weather: {weatherData.weather[0].description}</p>
                        <p>Wind Speed: {weatherData.wind.speed} m/s</p>
                    </div>
                )}

                {showRecentSearches && ( // Only render recent searches if showRecentSearches is true
                    <div className="recent-searches">
                        <h2>Recent Searches</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Temperature</th>
                                    <th>Weather</th>
                                    <th>Wind Speed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSearches.map((search, index) => (
                                    <tr key={index}>
                                        <td><strong>{search.name}</strong></td>
                                        <td style={{ color: getTemperatureColor(search.temperature) }}>{getTemperature(search.temperature)} {unit === 'metric' ? '°C' : '°F'}</td>
                                        <td>{search.weather}</td>
                                        <td>{search.wind} m/s</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="states-container">
                {stateWeatherData.map((state, index) => (
                    <div
                        key={index}
                        className="state"
                        onMouseEnter={() => setHoveredState(state)}
                        onMouseLeave={() => setHoveredState(null)}
                    >
                        {state.name}

                        <div className="city-chart">
                            {hoveredState === state && (
                                <canvas id="city-temperature-chart"></canvas>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeatherApp;
