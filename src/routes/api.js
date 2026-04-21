import express from 'express';
import regionRoutes from './regionRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import reforestationRoutes from './reforestationRoutes.js';
import impactRoutes from './impactRoutes.js';
import aiRoutes from './aiRoutes.js';
import detectionRoutes from './detectionRoutes.js';

const router = express.Router();

router.use('/regions', regionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reforestation', reforestationRoutes);
router.use('/impact', impactRoutes);
router.use('/ai', aiRoutes);
router.use('/detection', detectionRoutes);

export default router;
