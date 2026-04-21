import express from 'express';
import { 
    suggestReforestation, 
    scoreReforestationZone,
    getTreeSpecies
} from '../controllers/reforestationController.js';

const router = express.Router();

router.post('/suggest', suggestReforestation);
router.post('/score', scoreReforestationZone);
router.get('/tree-species', getTreeSpecies);

export default router;
