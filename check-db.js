import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Region from './src/models/Region.js';

dotenv.config();

const checkData = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecoguard';
        await mongoose.connect(uri);
        const count = await Region.countDocuments();
        console.log(`Number of regions in DB: ${count}`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkData();
