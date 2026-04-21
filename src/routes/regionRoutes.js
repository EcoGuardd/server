import express from 'express';
import { 
    getRegions, 
    getRegionById, 
    createRegion, 
    updateRegion, 
    getRegionsMapData,
    getFullMapData,
    analyzeAnyLocation
} from '../controllers/regionController.js';

const router = express.Router();

router.get('/map/data', getRegionsMapData);
router.get('/map/full', getFullMapData);
router.get('/analyze', analyzeAnyLocation);

router.route('/')
    .get(getRegions)
    .post(createRegion);

router.route('/:id')
    .get(getRegionById)
    .put(updateRegion);

export default router;
