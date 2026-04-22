const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: { type: String, required: true, unique: true },
  type: { type: String, required: true }, // BOOKING_SUCCESS hoặc BOOKING_FAILED
  userId: { type: String, required: true },
  bookingId: { type: String, required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);