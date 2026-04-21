import TreeSpecies from '../models/TreeSpecies.js';
import Region from '../models/Region.js';

import aiService from '../services/aiService.js';

// @desc    Suggest reforestation plan
// @route   POST /api/reforestation/suggest
export const suggestReforestation = async (req, res, next) => {
    try {
        const { soilType, climate, region, areaToRestore } = req.body;

        let searchSoil = soilType;
        let searchClimate = climate;

        // Fetch from region if ID provided
        if (region) {
            const regionData = await Region.findById(region);
            if (regionData) {
                searchSoil = searchSoil || regionData.soilType;
                searchClimate = searchClimate || regionData.climate;
            }
        }

        if (!searchSoil || !searchClimate || !areaToRestore) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide soilType, climate, and areaToRestore' 
            });
        }

        // Use AI to generate highly specific trees instead of a static DB lookup
        let suggestedTrees = [];
        let optimalTreesPerHectare = 200; // Default fallback

        try {
            const prompt = `Generate a JSON object containing reforestation data for a ${searchClimate} climate with ${searchSoil} soil. 
            The JSON MUST strictly follow this exact format:
            {
              "optimalTreesPerHectare": 250, // Number representing optimal planting density per hectare based on this specific climate
              "trees": [
                {
                  "name": "Common Name",
                  "scientificName": "Scientific Name",
                  "survivalRate": 85, // Number between 50 and 95
                  "co2AbsorptionPerTree": 20, // Number representing kg of CO2 absorbed per year
                  "growthTimeYears": 10, // Number of years to mature
                  "description": "Short 1 sentence reason why it fits this climate."
                }
              ]
            }
            Generate exactly 3 trees in the array. Do not include any markdown formatting like \`\`\`json. Return ONLY the raw JSON object.`;

            const aiResponse = await aiService.generateResponse(prompt);
            
            // Attempt to parse the AI's JSON response
            const cleanedResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanedResponse);
            
            if (parsedData.optimalTreesPerHectare) {
                optimalTreesPerHectare = parsedData.optimalTreesPerHectare;
            }

            suggestedTrees = parsedData.trees || parsedData; // Fallback in case AI still returns just an array
            
            // Ensure it's an array
            if (!Array.isArray(suggestedTrees) || suggestedTrees.length === 0) {
                throw new Error("AI did not return a valid tree array");
            }
        } catch (aiError) {
            console.warn("Failed to generate dynamic trees, using fallback. Reason:", aiError.message);
            // Fallback generic trees if AI generation fails or times out
            suggestedTrees = [
                {
                    name: "Resilient Native Species A",
                    scientificName: "Nativus Prima",
                    survivalRate: 75,
                    co2AbsorptionPerTree: 15,
                    growthTimeYears: 8,
                    description: "A robust fallback species adapted to variable conditions."
                },
                {
                    name: "Drought-Tolerant Shrub",
                    scientificName: "Aridus Secunda",
                    survivalRate: 80,
                    co2AbsorptionPerTree: 10,
                    growthTimeYears: 5,
                    description: "Fast-growing soil stabilizer."
                }
            ];
            optimalTreesPerHectare = 200;
        }

        const treesRequired = areaToRestore * optimalTreesPerHectare;
        
        let estimatedSurvivalRate = 0;
        let cumulativeCO2 = 0;
        
        if (suggestedTrees.length > 0) {
            // Take up to 3 trees
            const topTrees = suggestedTrees.slice(0, 3);
            const sumSurvival = topTrees.reduce((acc, tree) => acc + (tree.survivalRate || 70), 0);
            estimatedSurvivalRate = sumSurvival / topTrees.length;
            
            // Calculate 10-year CO2 capture: trees * absorption * 10 years
            const avgAbsorption = (topTrees.reduce((acc, t) => acc + (t.co2AbsorptionPerTree || 15), 0) / topTrees.length) || 0;
            cumulativeCO2 = (treesRequired * avgAbsorption * 10) / 1000; // Tons
            
            // Update the array with the truncated top trees
            suggestedTrees = topTrees;
        }

        res.status(200).json({
            success: true,
            data: {
                suggestedTrees,
                treesRequired,
                estimatedSurvivalRate: Number(estimatedSurvivalRate.toFixed(1)),
                cumulativeCO2: Number(cumulativeCO2.toFixed(2)),
                searchContext: { soil: searchSoil, climate: searchClimate, area: areaToRestore }
            }
        });

    } catch (error) {

        next(error);
    }
};

// @desc    Score a reforestation zone based on climate + soil data
// @route   POST /api/reforestation/score
export const scoreReforestationZone = async (req, res, next) => {
    try {
        const { lat, lng, region } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, error: 'lat and lng are required' });
        }

        // --- Fetch Climate Data from Open-Meteo (free, no key) ---
        let totalRainfall = 0;
        try {
            const climateRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum&forecast_days=7&timezone=auto`
            );
            const climateData = await climateRes.json();
            const dailyRain = climateData.daily?.precipitation_sum || [];
            totalRainfall = dailyRain.reduce((sum, v) => sum + (v || 0), 0); // total mm over 7 days
        } catch (err) {
            console.warn('Open-Meteo fetch failed, using fallback rainfall:', err.message);
            totalRainfall = 30; // fallback: 30mm/week
        }

        // --- Fetch Soil Data from SoilGrids (free, no key) ---
        let soilQuality = 50; // default mid-quality
        try {
            const soilRes = await fetch(
                `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng}&lat=${lat}&property=phh2o&depth=0-5cm&value=mean`
            );
            const soilData = await soilRes.json();
            const phValue = soilData?.properties?.layers?.[0]?.depths?.[0]?.values?.mean;
            if (phValue) {
                // Optimal pH 5.5–7 → map to 0–100 quality
                const phNormalized = phValue / 10; // SoilGrids returns pH * 10
                soilQuality = phNormalized >= 5.5 && phNormalized <= 7 
                    ? 80 + Math.random() * 20 
                    : phNormalized >= 4.5 && phNormalized <= 7.5 
                    ? 40 + Math.random() * 40
                    : 20 + Math.random() * 20;
            }
        } catch (err) {
            console.warn('SoilGrids fetch failed, using fallback soil quality:', err.message);
        }

        // SIMULATED: replace with real NDVI/vegetation index from satellite data
        const vegetationIndexMap = {
            'India': 65,
            'Amazon': 90,
            'Congo': 85,
            'Southeast Asia': 75,
        };
        const vegetationIndex = vegetationIndexMap[region] ?? 55;

        // --- Calculate planting score ---
        const rainfallScore = Math.min((totalRainfall / 50) * 100, 100); // normalize to 0-100
        const score = Math.round((rainfallScore * 0.4) + (soilQuality * 0.4) + (vegetationIndex * 0.2));

        let grade;
        if (score >= 70) grade = 'best';
        else if (score >= 40) grade = 'moderate';
        else grade = 'avoid';

        // --- Species suggestion by region ---
        const speciesMap = {
            'India': ['Neem', 'Bamboo', 'Peepal', 'Teak'],
            'Amazon': ['Brazil Nut', 'Rubber Tree', 'Açaí Palm'],
            'Congo': ['African Mahogany', 'Ebony', 'Iroko'],
            'Southeast Asia': ['Dipterocarp', 'Teak', 'Rattan'],
            'default': ['Oak', 'Pine', 'Maple'],
        };
        const suggestedSpecies = speciesMap[region] ?? speciesMap['default'];

        const reasoning = `Based on 7-day rainfall of ${totalRainfall.toFixed(1)}mm and soil quality index of ${soilQuality.toFixed(0)}/100, ` +
            `this location scores ${score}/100 for reforestation suitability. ` +
            (grade === 'best' ? 'Excellent conditions — proceed with planting.' :
             grade === 'moderate' ? 'Moderate conditions — consider soil amendments before planting.' :
             'Poor conditions — irrigation or soil remediation required before planting.');

        res.status(200).json({
            success: true,
            data: { score, grade, suggestedSpecies, reasoning, inputs: { totalRainfall, soilQuality, vegetationIndex } }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all tree species
// @route   GET /api/reforestation/tree-species
export const getTreeSpecies = async (req, res, next) => {
    try {
        const trees = await TreeSpecies.find();
        res.status(200).json({ success: true, data: trees });
    } catch (error) {
        next(error);
    }
};
