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
