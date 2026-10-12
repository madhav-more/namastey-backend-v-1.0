const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 1000 },
  serviceIds: { type: [String], required: true, validate: value => value.length > 0 },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR', enum: ['INR'] },
  includes: { type: [String], default: [] },
  popular: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 100 },
}, { timestamps: true });
module.exports = mongoose.model('Package', schema);
