import express from 'express';
import { analyzeZones, reviewZone } from '../controllers/detectionController.js';

const router = express.Router();

// GET /api/detection/analyze
router.get('/analyze', analyzeZones);

// PATCH /api/detection/zones/:id/review
router.patch('/zones/:id/review', reviewZone);

export default router;
