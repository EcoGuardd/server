import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import Region from '../src/models/Region.js';
import TreeSpecies from '../src/models/TreeSpecies.js';

dotenv.config();

// Since db.js likely uses process.env.MONGO_URI, we connect
connectDB();

const regions = [
    {
        name: "Amazon North",
        country: "Brazil",
        totalForestArea: 50000,
        forestLost: 25000,
        soilType: "clay",
        climate: "tropical",
        coordinates: { lat: -3.4653, lng: -62.2159 },
        forestLossHistory: [
            { year: 2020, loss: 5000 },
            { year: 2021, loss: 8000 },
            { year: 2022, loss: 12000 }
        ]
    },
    {
        name: "Western Ghats",
        country: "India",
        totalForestArea: 160000,
        forestLost: 5000,
        soilType: "loam",
        climate: "tropical",
        coordinates: { lat: 10.1834, lng: 77.0118 },
        forestLossHistory: [
            { year: 2020, loss: 1500 },
            { year: 2021, loss: 1500 },
            { year: 2022, loss: 2000 }
        ]
    }
];

const trees = [
    {
        name: "Neem",
        suitableSoilTypes: ["loam", "sandy"],
        suitableClimates: ["tropical", "arid"],
        survivalRate: 85,
        co2AbsorptionPerTree: 20.5,
        growthRate: "fast"
    },
    {
        name: "Bamboo",
        suitableSoilTypes: ["clay", "loam"],
        suitableClimates: ["tropical", "temperate"],
        survivalRate: 90,
        co2AbsorptionPerTree: 30.0,
        growthRate: "fast"
    },
    {
        name: "Oak",
        suitableSoilTypes: ["loam", "clay"],
        suitableClimates: ["temperate"],
        survivalRate: 75,
        co2AbsorptionPerTree: 22.0,
        growthRate: "slow"
    },
    {
        name: "Teak",
        suitableSoilTypes: ["loam", "clay"],
        suitableClimates: ["tropical"],
        survivalRate: 80,
        co2AbsorptionPerTree: 21.0,
        growthRate: "medium"
    }
];

const importData = async () => {
    try {
        await Region.deleteMany();
        await TreeSpecies.deleteMany();

        await Region.create(regions);
        await TreeSpecies.create(trees);

        console.log('Seed data imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
