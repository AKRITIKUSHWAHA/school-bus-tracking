const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({
    busNumber: { type: String, required: true, unique: true },
    driverName: { type: String, required: true },
    route: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['On Trip', 'Parked', 'Maintenance'], 
        default: 'Parked' 
    },
    currentLocation: {
        lat: { type: Number, default: 28.6139 },
        lng: { type: Number, default: 77.2090 }
    }
});

module.exports = mongoose.model('Bus', BusSchema);