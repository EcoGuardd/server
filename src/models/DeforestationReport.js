import mongoose from 'mongoose';

const deforestationReportSchema = new mongoose.Schema({
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
    },
    areaLoss: {
        type: Number, // In hectares
        required: true
    },
    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        required: true
    },
    detectedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model('DeforestationReport', deforestationReportSchema);
