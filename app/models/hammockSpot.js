const mongoose = require('mongoose')

const hammockSpotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('HammockSpot', hammockSpotSchema)
