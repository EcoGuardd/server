import express from 'express';
import { 
    getDashboardStats, 
    getForestLossOverTime, 
    getRegionRisk 
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/forest-loss-over-time', getForestLossOverTime);
router.get('/region-risk', getRegionRisk);

export default router;
