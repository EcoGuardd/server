import Region from '../models/Region.js';
import TreeSpecies from '../models/TreeSpecies.js';
import { 
    fetchClimateData, 
    fetchFireAlerts, 
    fetchCountryInfo, 
    fetchElevation 
} from '../services/externalDataService.js';

// @desc    Get all regions
// @route   GET /api/regions
// @access  Public
export const getRegions = async (req, res, next) => {
    try {
        const { risk, climate, soil } = req.query;
        let query = {};
        
        if (risk) query.riskLevel = risk;
        if (climate) query.climate = climate;
        if (soil) query.soilType = soil;

        const regions = await Region.find(query).select('name status riskLevel coordinates');
        res.status(200).json({ success: true, data: regions });
    } catch (error) {
        next(error);
    }
};

// @desc    Get map data for regions
// @route   GET /api/regions/map/data
// @access  Public
export const getRegionsMapData = async (req, res, next) => {
    try {
        const regions = await Region.find().select('name coordinates status riskLevel');
        
        const enrichedRegions = await Promise.allSettled(regions.map(async (region) => {
            const { lat, lng } = region.coordinates;
            
            const [fireRes, climateRes] = await Promise.allSettled([
                fetchFireAlerts(lat, lng),
                fetchClimateData(lat, lng)
            ]);

            const fireData = fireRes.status === 'fulfilled' ? fireRes.value : { activeAlerts: false, alertCount: 0 };
            const climateData = climateRes.status === 'fulfilled' ? climateRes.value : { temperature: null };

            return {
                ...region.toObject(),
                liveAlerts: fireData.activeAlerts,
                alertCount: fireData.alertCount,
                currentTemperature: climateData.temperature
            };
        }));

        const data = enrichedRegions
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// @desc    Get complete region details with live data
// @route   GET /api/regions/:id
// @access  Public
export const getRegionById = async (req, res, next) => {
    try {
        const region = await Region.findById(req.params.id);
        if (!region) {
            return res.status(404).json({ success: false, error: 'Region not found' });
        }

        const { lat, lng } = region.coordinates;
        const countryName = region.country;

        const results = await Promise.allSettled([
            fetchClimateData(lat, lng),
            fetchFireAlerts(lat, lng),
            fetchElevation(lat, lng),
            fetchCountryInfo(countryName)
        ]);

        const getVal = (idx, fallback) => results[idx].status === 'fulfilled' ? results[idx].value : fallback;

        const liveData = {
            climate: getVal(0, { temperature: null, windspeed: null, precipitation: null }),
            fireAlerts: getVal(1, { activeAlerts: false, alertCount: 0 }),
            elevation: getVal(2, { elevation: null }).elevation,
            countryInfo: getVal(3, { region: '', subregion: '', population: 0, flagUrl: '' })
        };

        res.status(200).json({ 
            success: true, 
            data: {
                ...region.toObject(),
                liveData
            } 
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get full map data with tree species and impact
// @route   GET /api/regions/map/full
// @access  Public
export const getFullMapData = async (req, res, next) => {
    try {
        const regions = await Region.find();
        
        const enriched = await Promise.allSettled(regions.map(async (region) => {
            const { lat, lng } = region.coordinates;
            
            // Parallel API calls
            const [fireRes, climateRes, treeRes] = await Promise.allSettled([
                fetchFireAlerts(lat, lng),
                fetchClimateData(lat, lng),
                TreeSpecies.find({
                    suitableSoilTypes: region.soilType,
                    suitableClimates: region.climate
                }).sort({ survivalRate: -1 }).limit(2)
            ]);

            const fireData = fireRes.status === 'fulfilled' ? fireRes.value : { activeAlerts: false, alertCount: 0 };
            const climateData = climateRes.status === 'fulfilled' ? climateRes.value : { temperature: null };
            const topTrees = treeRes.status === 'fulfilled' ? treeRes.value.map(t => t.name) : [];

            // Calculate CO2 impact: forestLost * 200 trees * 21.7 kg / 1000 = tons
            const co2Impact = (region.forestLost * 200 * 21.7) / 1000;

            return {
                name: region.name,
                coordinates: region.coordinates,
                status: region.status,
                riskLevel: region.riskLevel,
                forestLost: region.forestLost,
                totalForestArea: region.totalForestArea,
                liveAlerts: fireData.activeAlerts,
                alertCount: fireData.alertCount,
                currentTemperature: climateData.temperature,
                suggestedTrees: topTrees,
                co2Impact: Number(co2Impact.toFixed(2))
            };
        }));

        const data = enriched
            .filter(e => e.status === 'fulfilled')
            .map(e => e.value);

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// @desc    Analyze any location on earth for environmental data
// @route   GET /api/regions/analyze
// @access  Public
export const analyzeAnyLocation = async (req, res, next) => {
    try {
        const { lat, lng, name = 'Searched Location' } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, error: 'Please provide latitude and longitude' });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        // Parallel API calls for live data
        const [fireRes, climateRes, elevationRes, countryRes] = await Promise.allSettled([
            fetchFireAlerts(latitude, longitude),
            fetchClimateData(latitude, longitude),
            fetchElevation(latitude, longitude),
            fetchCountryInfo(req.query.country || '') // country is optional
        ]);

        const fireData = fireRes.status === 'fulfilled' ? fireRes.value : { activeAlerts: false, alertCount: 0 };
        const climateData = climateRes.status === 'fulfilled' ? climateRes.value : { temperature: null, precipitation: 0 };
        const elevation = elevationRes.status === 'fulfilled' ? elevationRes.value.elevation : null;
        const countryInfo = countryRes.status === 'fulfilled' ? countryRes.value : {};

        // Determine a heuristic risk level
        let riskLevel = 'low';
        let status = 'safe';

        if (fireData.activeAlerts || fireData.alertCount > 5) {
            riskLevel = 'high';
            status = 'deforested';
        } else if (climateData.temperature > 35 || fireData.alertCount > 0) {
            riskLevel = 'medium';
            status = 'at-risk';
        }

        // Find suitable tree species based on climate
        // Note: For virtual regions, we default to loam/clay soil for suggestions
        const climateType = climateData.temperature > 25 ? 'tropical' : 
                          climateData.temperature < 10 ? 'boreal' : 'temperate';
        
        const treeRes = await TreeSpecies.find({
            suitableClimates: climateType
        }).sort({ survivalRate: -1 }).limit(2);

        const suggestedTrees = treeRes.map(t => t.name);

        // Hypothetical CO2 impact (if we assume 5000 hectares of reforestation)
        const virtualForestLost = 5000;
        const co2Impact = (virtualForestLost * 200 * 21.7) / 1000;

        const data = {
            name,
            coordinates: { lat: latitude, lng: longitude },
            status,
            riskLevel,
            forestLost: virtualForestLost,
            totalForestArea: 10000,
            liveAlerts: fireData.activeAlerts,
            alertCount: fireData.alertCount,
            currentTemperature: climateData.temperature,
            suggestedTrees,
            co2Impact: Number(co2Impact.toFixed(2)),
            liveData: {
                climate: climateData,
                fireAlerts: fireData,
                elevation,
                countryInfo
            }
        };

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new region
// @route   POST /api/regions
// @access  Admin / Seeding
export const createRegion = async (req, res, next) => {
    try {
        const region = await Region.create(req.body);
        res.status(201).json({ success: true, data: region });
    } catch (error) {
        next(error);
    }
};

// @desc    Update region data
// @route   PUT /api/regions/:id
// @access  Public
export const updateRegion = async (req, res, next) => {
    try {
        let region = await Region.findById(req.params.id);
        if (!region) {
            return res.status(404).json({ success: false, error: 'Region not found' });
        }

        Object.assign(region, req.body);
        await region.save();

        res.status(200).json({ success: true, data: region });
    } catch (error) {
        next(error);
    }
};
