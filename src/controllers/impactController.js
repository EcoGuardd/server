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
