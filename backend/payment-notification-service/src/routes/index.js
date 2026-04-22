// src/routes/index.js
// REST API endpoints để kiểm tra service + xem lịch sử

const express = require('express');
const router = express.Router();
const { getPaymentHistory } = require('../services/payment.service');
const { getNotificationHistory } = require('../services/notification.service');
const { publishEvent } = require('../publishers/eventPublisher');
const EVENTS = require('../constants/events');

// ─── Health check ────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'payment-notification-service',
    port: process.env.PORT || 8084,
    timestamp: new Date().toISOString(),
  });
});

// ─── Xem lịch sử payment ─────────────────────────────────────
router.get('/payments', (req, res) => {
  res.json({
    success: true,
    total: getPaymentHistory().length,
    data: getPaymentHistory(),
  });
});

// ─── Xem lịch sử notification ────────────────────────────────
router.get('/notifications', (req, res) => {
  res.json({
    success: true,
    total: getNotificationHistory().length,
    data: getNotificationHistory(),
  });
});

// ─── TEST: Giả lập publish BOOKING_CREATED (để test không cần Booking Service) ──
router.post('/test/simulate-booking', (req, res) => {
  const mockBooking = {
    bookingId: req.body.bookingId || `BK-${Date.now()}`,
    userId: req.body.userId || 'user-001',
    movieId: req.body.movieId || 'movie-001',
    seats: req.body.seats || ['A1', 'A2'],
    totalAmount: req.body.totalAmount || 150000,
  };

  console.log('[TEST] Giả lập BOOKING_CREATED:', mockBooking);

  publishEvent(EVENTS.BOOKING_CREATED, mockBooking);

  res.json({
    success: true,
    message: 'Event BOOKING_CREATED đã được publish. Xem console để theo dõi.',
    data: mockBooking,
  });
});

module.exports = router;
