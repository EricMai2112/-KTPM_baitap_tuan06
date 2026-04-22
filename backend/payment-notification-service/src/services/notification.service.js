// src/services/notification.service.js
// Xử lý gửi thông báo khi nhận event PAYMENT_COMPLETED

// Lưu lịch sử thông báo trong memory
const notificationHistory = [];

/**
 * Gửi thông báo đặt vé thành công
 * Hiện tại: console.log (có thể mở rộng sang email, SMS, websocket)
 */
function sendSuccessNotification(payload) {
  const { bookingId, userId, movieId, seats, totalAmount } = payload;

  const notification = {
    notificationId: `NOTIF-${Date.now()}`,
    type: 'BOOKING_SUCCESS',
    userId,
    bookingId,
    message: `🎬 Booking #${bookingId} thành công! Bạn đã đặt ${seats} ghế cho phim ${movieId}.`,
    sentAt: new Date().toISOString(),
  };

  notificationHistory.push(notification);

  // --- OUTPUT THÔNG BÁO RA CONSOLE ---
  console.log('\n' + '='.repeat(60));
  console.log('🔔 [NOTIFICATION] BOOKING THÀNH CÔNG!');
  console.log(`   📋 Booking ID : #${bookingId}`);
  console.log(`   👤 User ID    : ${userId}`);
  console.log(`   🎬 Movie ID   : ${movieId}`);
  console.log(`   💺 Ghế        : ${Array.isArray(seats) ? seats.join(', ') : seats}`);
  console.log(`   💰 Tổng tiền  : ${formatCurrency(totalAmount)}`);
  console.log(`   ⏰ Thời gian  : ${notification.sentAt}`);
  console.log('='.repeat(60) + '\n');

  return notification;
}

/**
 * Gửi thông báo đặt vé thất bại
 */
function sendFailedNotification(payload) {
  const { bookingId, userId, reason } = payload;

  const notification = {
    notificationId: `NOTIF-${Date.now()}`,
    type: 'BOOKING_FAILED',
    userId,
    bookingId,
    message: `❌ Booking #${bookingId} thất bại. Lý do: ${reason}`,
    sentAt: new Date().toISOString(),
  };

  notificationHistory.push(notification);

  console.log('\n' + '='.repeat(60));
  console.log('🔔 [NOTIFICATION] BOOKING THẤT BẠI!');
  console.log(`   📋 Booking ID : #${bookingId}`);
  console.log(`   👤 User ID    : ${userId}`);
  console.log(`   ❗ Lý do      : ${reason}`);
  console.log(`   ⏰ Thời gian  : ${notification.sentAt}`);
  console.log('='.repeat(60) + '\n');

  return notification;
}

function getNotificationHistory() {
  return notificationHistory;
}

function formatCurrency(amount) {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

module.exports = { sendSuccessNotification, sendFailedNotification, getNotificationHistory };
