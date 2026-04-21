import mongoose from 'mongoose';

const reforestationPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    locationName: {
        type: String,
        required: true
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
    },
    areaSize: {
        type: Number, // In hectares or sq km
        required: true
    },
    treeType: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Planned', 'In Progress', 'Completed'],
        default: 'Planned'
    }
}, { timestamps: true });

export default mongoose.model('ReforestationPlan', reforestationPlanSchema);
