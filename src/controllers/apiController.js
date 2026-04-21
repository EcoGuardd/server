import DeforestationReport from '../models/DeforestationReport.js';
import ReforestationPlan from '../models/ReforestationPlan.js';

export const getMapData = async (req, res) => {
    try {
        // For now, we return mock geographical data or fetch from our DB
        const reports = await DeforestationReport.find().limit(100);
        const plans = await ReforestationPlan.find().limit(100);

        res.json({
            success: true,
            data: {
                deforestation: reports,
                reforestation: plans
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching map data' });
    }
};

export const getStats = async (req, res) => {
    try {
        const totalPlans = await ReforestationPlan.countDocuments();
        const totalDeforestationReports = await DeforestationReport.countDocuments();

        res.json({
            success: true,
            data: {
                totalPlans,
                totalDeforestationReports,
                treesPlantedEstimate: totalPlans * 1000 // Just a fun mock stat
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching stats' });
    }
};
