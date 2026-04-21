import axios from 'axios';

const TIMEOUT = 5000; // 5 seconds

/**
 * Fetch climate data from Open-Meteo
 */
export const fetchClimateData = async (lat, lng) => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=precipitation_probability`;
        const response = await axios.get(url, { timeout: TIMEOUT });
        
        const current = response.data.current_weather;
        const precipitation = response.data.hourly?.precipitation_probability?.[0] || 0;

        return {
            temperature: current?.temperature || null,
            windspeed: current?.windspeed || null,
            weatherCode: current?.weathercode || null,
            precipitation
        };
    } catch (error) {
        console.error(`fetchClimateData Error (${lat}, ${lng}): ${error.message}`);
        return { temperature: null, windspeed: null, weatherCode: null, precipitation: null };
    }
};

/**
 * Fetch fire alerts from NASA FIRMS
 */
export const fetchFireAlerts = async (lat, lng) => {
    const key = process.env.NASA_FIRMS_MAP_KEY;
    if (!key || key === 'your_nasa_firms_key_here') {
        return { activeAlerts: false, alertCount: 0 };
    }

    try {
        // Area: lng, lat, lng+1, lat+1 for a 1-degree square roughly
        const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_SNPP_NRT/${lng},${lat},${lng + 1},${lat + 1}/1`;
        const response = await axios.get(url, { timeout: TIMEOUT });
        
        // Parse CSV - simplified: count non-header lines
        const lines = response.data.trim().split('\n');
        const alertCount = lines.length > 1 ? lines.length - 1 : 0;

        return {
            activeAlerts: alertCount > 0,
            alertCount
        };
    } catch (error) {
        console.error(`fetchFireAlerts Error (${lat}, ${lng}): ${error.message}`);
        return { activeAlerts: false, alertCount: 0 };
    }
};

/**
 * Fetch country info from RestCountries
 */
export const fetchCountryInfo = async (countryName) => {
    if (!countryName) return {};
    try {
        const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`;
        const response = await axios.get(url, { timeout: TIMEOUT });
        
        const country = response.data[0];
        return {
            region: country?.region || 'Unknown',
            subregion: country?.subregion || 'Unknown',
            population: country?.population || 0,
            flagUrl: country?.flags?.svg || country?.flags?.png || ''
        };
    } catch (error) {
        console.error(`fetchCountryInfo Error (${countryName}): ${error.message}`);
        return {};
    }
};

/**
 * Fetch elevation from Open-Elevation
 */
export const fetchElevation = async (lat, lng) => {
    try {
        const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`;
        const response = await axios.get(url, { timeout: TIMEOUT });
        
        const elevation = response.data.results?.[0]?.elevation || null;
        return { elevation };
    } catch (error) {
        console.error(`fetchElevation Error (${lat}, ${lng}): ${error.message}`);
        return { elevation: null };
    }
};
