import express from 'express';
import { 
    suggestReforestation, 
    getTreeSpecies 
} from '../controllers/reforestationController.js';

const router = express.Router();

router.post('/suggest', suggestReforestation);
router.get('/tree-species', getTreeSpecies);

export default router;
