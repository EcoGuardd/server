import Region from '../models/Region.js';

// @desc    Get total dashboard stats
// @route   GET /api/dashboard/stats
export const getDashboardStats = async (req, res, next) => {
    try {
        const regions = await Region.find();
        
        let totalForestLoss = 0;
        let highRiskCount = 0;
        let mediumRiskCount = 0;
        let lowRiskCount = 0;
        let safeRegions = 0;
        let deforestedRegions = 0;

        regions.forEach(region => {
            totalForestLoss += region.forestLost;
            
            if (region.riskLevel === 'high') highRiskCount++;
            if (region.riskLevel === 'medium') mediumRiskCount++;
            if (region.riskLevel === 'low') lowRiskCount++;

            if (region.status === 'safe') safeRegions++;
            if (region.status === 'deforested') deforestedRegions++;
        });

        const treesNeeded = totalForestLoss * 200;
        const co2Impact = (treesNeeded * 21.7) / 1000;

        res.status(200).json({
            success: true,
            data: {
                totalForestLoss,
                treesNeeded,
                co2Impact,
                totalRegions: regions.length,
                highRiskCount,
                mediumRiskCount,
                lowRiskCount,
                safeRegions,
                deforestedRegions
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get forest loss over time
// @route   GET /api/dashboard/forest-loss-over-time
export const getForestLossOverTime = async (req, res, next) => {
    try {
        const aggregate = await Region.aggregate([
            { $unwind: '$forestLossHistory' },
            {
                $group: {
                    _id: '$forestLossHistory.year',
                    totalLoss: { $sum: '$forestLossHistory.loss' }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    year: '$_id',
                    totalLoss: 1
                }
            }
        ]);

        res.status(200).json({ success: true, data: aggregate });
    } catch (error) {
        next(error);
    }
};

// @desc    Get region risk profile
// @route   GET /api/dashboard/region-risk
export const getRegionRisk = async (req, res, next) => {
    try {
        const regions = await Region.find().select('name riskLevel forestLost -_id');
        res.status(200).json({ success: true, data: regions });
    } catch (error) {
        next(error);
    }
};
