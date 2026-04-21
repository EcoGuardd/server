import mongoose from 'mongoose';

const treeSpeciesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    suitableSoilTypes: [{
        type: String,
        enum: ['clay', 'loam', 'sandy', 'silt', 'peaty']
    }],
    suitableClimates: [{
        type: String,
        enum: ['tropical', 'arid', 'temperate', 'boreal', 'mediterranean']
    }],
    survivalRate: {
        type: Number, // percentage out of 100
        required: true
    },
    co2AbsorptionPerTree: {
        type: Number, // kg per year
        required: true
    },
    growthRate: {
        type: String,
        enum: ['slow', 'medium', 'fast'],
        required: true
    }
}, { timestamps: true });

export default mongoose.model('TreeSpecies', treeSpeciesSchema);
