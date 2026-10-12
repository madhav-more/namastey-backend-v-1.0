const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 1000 },
  kind: { type: String, enum: ['airport', 'railway', 'hotel', 'function', 'welcome', 'other'], default: 'welcome' },
  active: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('Service', schema);
