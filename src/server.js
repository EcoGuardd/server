import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initSyncJob } from './jobs/syncJob.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(() => {
    // Start background jobs
    initSyncJob();
});

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Body parser
app.use(morgan('dev')); // Logging

// Mount routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('EcoGuard API is running...');
});

// Use error handler middleware
app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is listening at port ${port}`);
});