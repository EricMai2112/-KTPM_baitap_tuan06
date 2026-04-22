// src/consumers/bookingConsumer.js
// Lắng nghe event BOOKING_CREATED từ Booking Service

const { getChannel, EXCHANGE_NAME } = require('../config/rabbitmq');
const { processPayment } = require('../services/payment.service');
const EVENTS = require('../constants/events');

const QUEUE_NAME = process.env.QUEUE_BOOKING_CREATED || 'booking_created_queue';

/**
 * Đăng ký consumer lắng nghe BOOKING_CREATED
 * Routing key: booking_created (từ Booking Service publish lên)
 */
async function startBookingConsumer() {
  const channel = getChannel();

  if (!channel) {
    console.warn('[BookingConsumer] Không có channel, bỏ qua.');
    return;
  }

  // Khai báo queue bền vững (durable: true)
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  // Bind queue với exchange, chỉ nhận routing key = 'booking_created'
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, EVENTS.BOOKING_CREATED.toLowerCase());

  // Chỉ nhận 1 message tại một thời điểm (fair dispatch)
  channel.prefetch(1);

  console.log(`[BookingConsumer] 👂 Đang lắng nghe queue: ${QUEUE_NAME}`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());
      console.log(`\n[BookingConsumer] 📩 Nhận event [${content.event}]:`, content.data);

      // Xử lý thanh toán
      await processPayment(content.data);

      // Xác nhận đã xử lý xong
      channel.ack(msg);
    } catch (err) {
      console.error('[BookingConsumer] ❌ Lỗi xử lý message:', err.message);
      // nack + không requeue để tránh loop lỗi vô tận
      channel.nack(msg, false, false);
    }
  });
}

module.exports = { startBookingConsumer };
