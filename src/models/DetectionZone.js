import mongoose from 'mongoose';

const detectionZoneSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  treeLossPct: { type: Number, required: true },
  risk: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'illegal_logging'], 
    default: 'low' 
  },
  label: { type: String, required: true },
  region: { type: String, required: true },
  reviewed: { type: Boolean, default: false }
}, { timestamps: true });

const DetectionZone = mongoose.model('DetectionZone', detectionZoneSchema);
export default DetectionZone;
