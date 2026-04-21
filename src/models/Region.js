import mongoose from 'mongoose';

const regionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    country: {
        type: String,
        required: true
    },
    totalForestArea: {
        type: Number, // hectares
        required: true
    },
    forestLost: {
        type: Number, // hectares
        required: true
    },
    soilType: {
        type: String,
        enum: ['clay', 'loam', 'sandy', 'silt', 'peaty'],
        required: true
    },
    climate: {
        type: String,
        enum: ['tropical', 'arid', 'temperate', 'boreal', 'mediterranean'],
        required: true
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high']
    },
    status: {
        type: String,
        enum: ['safe', 'deforested', 'at-risk']
    },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    forestLossHistory: [{
        year: { type: Number, required: true },
        loss: { type: Number, required: true }
    }]
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for forest loss percentage
regionSchema.virtual('forestLossPercent').get(function() {
    if (!this.totalForestArea || this.totalForestArea === 0) return 0;
    return (this.forestLost / this.totalForestArea) * 100;
});

// Pre-save hook to calculate riskLevel and status
regionSchema.pre('save', function() {
    const lossPercent = this.forestLossPercent;
    
    // Calculate riskLevel
    if (lossPercent < 10) {
        this.riskLevel = 'low';
    } else if (lossPercent <= 30) {
        this.riskLevel = 'medium';
    } else {
        this.riskLevel = 'high';
    }

    // Calculate status
    if (this.riskLevel === 'high') {
        this.status = 'deforested';
    } else if (this.riskLevel === 'medium') {
        this.status = 'at-risk';
    } else {
        this.status = 'safe';
    }
});

export default mongoose.model('Region', regionSchema);
