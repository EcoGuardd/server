import express from 'express';
import { 
    getImpactSummary, 
    calculateSpecificImpact 
} from '../controllers/impactController.js';

const router = express.Router();

router.get('/summary', getImpactSummary);
router.post('/calculate', calculateSpecificImpact);

export default router;
