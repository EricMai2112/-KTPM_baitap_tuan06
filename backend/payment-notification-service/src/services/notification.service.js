// src/services/notification.service.js
const Notification = require('../models/notification.model'); // Import Model Notification

/**
 * Gửi thông báo đặt vé thành công và lưu vào DB
 */
async function sendSuccessNotification(payload) {
  const { bookingId, userId, movieId, seats, totalAmount } = payload;

  const notification = {
    notificationId: `NOTIF-${Date.now()}`,
    type: 'BOOKING_SUCCESS',
    userId,
    bookingId,
    message: `🎬 Booking #${bookingId} thành công! Bạn đã đặt ${seats} ghế cho phim ${movieId}.`,
    // sentAt sẽ tự động lấy Date.now() theo Schema
  };

  // Lưu thông báo vào MongoDB
  await Notification.create(notification);

  // --- OUTPUT THÔNG BÁO RA CONSOLE ---
  console.log('\n' + '='.repeat(60));
  console.log('🔔 [NOTIFICATION] BOOKING THÀNH CÔNG!');
  console.log(`   📋 Booking ID : #${bookingId}`);
  console.log(`   👤 User ID    : ${userId}`);
  console.log(`   🎬 Movie ID   : ${movieId}`);
  console.log(`   💺 Ghế        : ${Array.isArray(seats) ? seats.join(', ') : seats}`);
  console.log(`   💰 Tổng tiền  : ${formatCurrency(totalAmount)}`);
  console.log('='.repeat(60) + '\n');

  return notification;
}

/**
 * Gửi thông báo đặt vé thất bại và lưu vào DB
 */
async function sendFailedNotification(payload) {
  const { bookingId, userId, reason } = payload;

  const notification = {
    notificationId: `NOTIF-${Date.now()}`,
    type: 'BOOKING_FAILED',
    userId,
    bookingId,
    message: `❌ Booking #${bookingId} thất bại. Lý do: ${reason}`,
  };

  // Lưu thông báo vào MongoDB
  await Notification.create(notification);

  console.log('\n' + '='.repeat(60));
  console.log('🔔 [NOTIFICATION] BOOKING THẤT BẠI!');
  console.log(`   📋 Booking ID : #${bookingId}`);
  console.log(`   👤 User ID    : ${userId}`);
  console.log(`   ❗ Lý do      : ${reason}`);
  console.log('='.repeat(60) + '\n');

  return notification;
}

// Cập nhật hàm lấy lịch sử thành Async để query MongoDB
async function getNotificationHistory() {
  return await Notification.find().sort({ sentAt: -1 });
}

function formatCurrency(amount) {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

module.exports = { sendSuccessNotification, sendFailedNotification, getNotificationHistory };