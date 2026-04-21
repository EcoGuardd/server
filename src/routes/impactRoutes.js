import express from 'express';
import { 
    getImpactSummary, 
    calculateSpecificImpact,
    calculateGrowthImpact
} from '../controllers/impactController.js';

const router = express.Router();

router.get('/summary', getImpactSummary);
router.post('/calculate', calculateSpecificImpact);
router.post('/growth', calculateGrowthImpact);

export default router;
