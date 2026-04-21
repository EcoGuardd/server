import DetectionZone from '../models/DetectionZone.js';
import axios from 'axios';

// SIMULATED: replace with real ML model or FIRMS API processing in production
const generateSimulatedZones = (count, region) => {
  const zones = [];
  const regions = {
    'India': { lat: 20.5937, lng: 78.9629, spread: 15 },
    'Amazon': { lat: -3.4653, lng: -62.2159, spread: 20 },
    'Congo': { lat: -0.2280, lng: 15.8277, spread: 10 },
    'Southeast Asia': { lat: 10.0, lng: 105.0, spread: 15 },
  };

  const targetRegion = regions[region] || { lat: 0, lng: 0, spread: 60 };

  for (let i = 0; i < count; i++) {
    const lat = targetRegion.lat + (Math.random() - 0.5) * targetRegion.spread;
    const lng = targetRegion.lng + (Math.random() - 0.5) * targetRegion.spread;
    const treeLossPct = Math.random() * 25; // 0 to 25%
    const isProtected = Math.random() > 0.8; // 20% chance of being protected

    let risk = 'low';
    if (treeLossPct > 20 && isProtected) {
      risk = 'illegal_logging';
    } else if (treeLossPct > 10) {
      risk = 'high';
    } else if (treeLossPct > 5) {
      risk = 'medium';
    }

    zones.push({
      lat,
      lng,
      treeLossPct,
      risk,
      label: `Zone ${Math.floor(Math.random() * 1000)}`,
      region: region || 'Global',
    });
  }
  return zones;
};

export const analyzeZones = async (req, res) => {
  try {
    // 1. In a real app, fetch from NASA FIRMS using process.env.FIRMS_API_KEY
    // const response = await axios.get(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${process.env.FIRMS_API_KEY}/VIIRS_SNPP_NRT/world/1`);
    
    // 2. Clear out old non-reviewed simulated zones (for hackathon/demo purposes to avoid endless DB growth)
    await DetectionZone.deleteMany({ reviewed: false, createdAt: { $lt: new Date(Date.now() - 3600000) } }); // delete older than 1hr

    // 3. Generate new simulated data
    const newZonesData = [
      ...generateSimulatedZones(3, 'India'),
      ...generateSimulatedZones(3, 'Amazon'),
      ...generateSimulatedZones(2, 'Congo'),
      ...generateSimulatedZones(3, 'Southeast Asia'),
    ];

    // Filter to add some illegal logging alerts intentionally for demo purposes
    if (!newZonesData.some(z => z.risk === 'illegal_logging')) {
      newZonesData.push({
        lat: -3.0, lng: -60.0,
        treeLossPct: 22.5,
        risk: 'illegal_logging',
        label: 'Protected Reserve Alpha',
        region: 'Amazon'
      });
    }

    // Insert into MongoDB
    const insertedZones = await DetectionZone.insertMany(newZonesData);
    
    // Return all unreviewed zones
    const allZones = await DetectionZone.find({ reviewed: false }).sort({ createdAt: -1 });
    res.status(200).json(allZones);
  } catch (error) {
    console.error('Error analyzing detection zones:', error);
    res.status(500).json({ error: 'Failed to analyze detection zones' });
  }
};

export const reviewZone = async (req, res) => {
  try {
    const { id } = req.params;
    const zone = await DetectionZone.findByIdAndUpdate(
      id,
      { reviewed: true },
      { new: true }
    );

    if (!zone) {
      return res.status(404).json({ error: 'Detection zone not found' });
    }

    res.status(200).json(zone);
  } catch (error) {
    console.error('Error reviewing detection zone:', error);
    res.status(500).json({ error: 'Failed to update detection zone' });
  }
};
