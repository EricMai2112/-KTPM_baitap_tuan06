// src/services/payment.service.js
// Logic xử lý thanh toán: random success/fail

const axios = require('axios');
const { publishEvent } = require('../publishers/eventPublisher');
const EVENTS = require('../constants/events');

// Lưu lịch sử payment trong memory (không cần DB)
const paymentHistory = [];

/**
 * Xử lý thanh toán cho một booking
 * - Random 80% success, 20% fail
 * - Publish event tương ứng
 * - Gọi Booking Service cập nhật trạng thái (nếu có)
 */
async function processPayment(bookingData) {
  const { bookingId, userId, movieId, seats, totalAmount } = bookingData;

  console.log(`\n[PaymentService] 💳 Đang xử lý thanh toán cho Booking #${bookingId}...`);

  // Giả lập thời gian xử lý payment (0.5 - 1.5s)
  await delay(500 + Math.random() * 1000);

  // Random success 80% / fail 20%
  const isSuccess = Math.random() < 0.8;

  const paymentRecord = {
    paymentId: `PAY-${Date.now()}`,
    bookingId,
    userId,
    totalAmount: totalAmount || 0,
    method: 'CARD', // giả lập
    status: isSuccess ? 'SUCCESS' : 'FAILED',
    processedAt: new Date().toISOString(),
  };

  paymentHistory.push(paymentRecord);

  if (isSuccess) {
    console.log(`[PaymentService] ✅ Thanh toán THÀNH CÔNG - Booking #${bookingId}`);

    // Publish PAYMENT_COMPLETED để Notification Service consume
    publishEvent(EVENTS.PAYMENT_COMPLETED, {
      paymentId: paymentRecord.paymentId,
      bookingId,
      userId,
      movieId,
      seats,
      totalAmount,
      message: `Booking #${bookingId} thanh toán thành công!`,
    });

    // Gọi Booking Service cập nhật trạng thái (nếu có)
    await updateBookingStatus(bookingId, 'PAID');
  } else {
    console.log(`[PaymentService] ❌ Thanh toán THẤT BẠI - Booking #${bookingId}`);

    // Publish BOOKING_FAILED
    publishEvent(EVENTS.BOOKING_FAILED, {
      bookingId,
      userId,
      reason: 'Payment processing failed',
    });

    // Gọi Booking Service cập nhật trạng thái thất bại
    await updateBookingStatus(bookingId, 'FAILED');
  }

  return paymentRecord;
}

/**
 * Gọi Booking Service để cập nhật trạng thái đơn
 */
async function updateBookingStatus(bookingId, status) {
  const bookingServiceUrl = process.env.BOOKING_SERVICE_URL;

  if (!bookingServiceUrl) {
    console.warn('[PaymentService] BOOKING_SERVICE_URL chưa cấu hình, bỏ qua update.');
    return;
  }

  try {
    await axios.patch(`${bookingServiceUrl}/bookings/${bookingId}/status`, { status });
    console.log(`[PaymentService] 🔄 Cập nhật Booking #${bookingId} → ${status}`);
  } catch (err) {
    console.warn(`[PaymentService] ⚠️ Không thể cập nhật Booking Service: ${err.message}`);
    // Không throw - service vẫn tiếp tục hoạt động
  }
}

function getPaymentHistory() {
  return paymentHistory;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { processPayment, getPaymentHistory };
