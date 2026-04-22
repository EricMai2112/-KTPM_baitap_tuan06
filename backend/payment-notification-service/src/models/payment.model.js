const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  bookingId: { type: String, required: true },
  userId: { type: String, required: true },
  totalAmount: { type: Number, default: 0 },
  method: { type: String, default: 'CARD' },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
  processedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);