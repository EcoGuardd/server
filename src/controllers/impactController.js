import TreeSpecies from '../models/TreeSpecies.js';
import Region from '../models/Region.js';
import { calculateImpact } from '../utils/impactCalculator.js';

// @desc    Get global environmental impact summary
// @route   GET /api/impact/summary
export const getImpactSummary = async (req, res, next) => {
    try {
        const regions = await Region.find();
        
        // Simulating data since we don't have user plans in current data models
        const totalDeforestedArea = regions.reduce((acc, r) => acc + r.forestLost, 0);
        
        // Hypothesize that 10% of deforested area is under reforestation plans for demo purposes
        const landRestored = totalDeforestedArea * 0.10; 
        const treesSaved = landRestored * 200; // 200 trees per hectare
        const co2Reduced = (treesSaved * 21.7) / 1000; // Tons

        res.status(200).json({
            success: true,
            data: {
                treesSaved,
                co2Reduced,
                landRestored,
                regionsMonitored: regions.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Calculate specific impact
// @route   POST /api/impact/calculate
export const calculateSpecificImpact = async (req, res, next) => {
    try {
        const { numberOfTrees, speciesName } = req.body;
        
        if (!numberOfTrees) {
            return res.status(400).json({ success: false, error: 'numberOfTrees is required' });
        }

        let co2Absorption = null;
        if (speciesName) {
            const species = await TreeSpecies.findOne({ name: speciesName });
            if (species) {
                co2Absorption = species.co2AbsorptionPerTree;
            }
        }

        const impactData = calculateImpact(numberOfTrees, co2Absorption);

        res.status(200).json({
            success: true,
            data: impactData
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Calculate reforestation growth and CO₂ impact
// @route   POST /api/impact/growth
export const calculateGrowthImpact = async (req, res, next) => {
    try {
        const { areaHectares, region, monthsElapsed } = req.body;

        if (!areaHectares || !monthsElapsed) {
            return res.status(400).json({ success: false, error: 'areaHectares and monthsElapsed are required' });
        }

        const treesPlanted = areaHectares * 1000;
        const survivalRate = 0.85;
        const activeTrees = Math.round(treesPlanted * survivalRate);
        const co2AbsorbedKg = Math.round(activeTrees * 21 * (monthsElapsed / 12));
        const growthPct = Math.min((monthsElapsed / 24) * 100, 100);

        // Build monthly projection for chart (1 to monthsElapsed)
        const monthlyData = [];
        for (let m = 1; m <= Math.min(monthsElapsed, 24); m++) {
            monthlyData.push({
                month: m,
                co2Kg: Math.round(activeTrees * 21 * (m / 12)),
                growthPct: Math.min((m / 24) * 100, 100),
            });
        }

        res.status(200).json({
            success: true,
            data: {
                treesPlanted,
                activeTrees,
                co2AbsorbedKg,
                areaRestored: Number(areaHectares),
                growthPct: Number(growthPct.toFixed(1)),
                region: region || 'Global',
                monthlyData,
            }
        });
    } catch (error) {
        next(error);
    }
};
