// src/consumers/notificationConsumer.js
// Lắng nghe event PAYMENT_COMPLETED và BOOKING_FAILED để gửi thông báo

const { getChannel, EXCHANGE_NAME } = require('../config/rabbitmq');
const { sendSuccessNotification, sendFailedNotification } = require('../services/notification.service');
const EVENTS = require('../constants/events');

const QUEUE_NAME = process.env.QUEUE_NOTIFICATION || 'notification_queue';

/**
 * Đăng ký consumer lắng nghe PAYMENT_COMPLETED + BOOKING_FAILED
 */
async function startNotificationConsumer() {
  const channel = getChannel();

  if (!channel) {
    console.warn('[NotificationConsumer] Không có channel, bỏ qua.');
    return;
  }

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  // Bind 2 routing key để nhận cả success lẫn failed
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, EVENTS.PAYMENT_COMPLETED.toLowerCase());
  await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, EVENTS.BOOKING_FAILED.toLowerCase());

  channel.prefetch(1);

  console.log(`[NotificationConsumer] 👂 Đang lắng nghe queue: ${QUEUE_NAME}`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());
      const { event, data } = content;

      console.log(`\n[NotificationConsumer] 📩 Nhận event [${event}]`);

      if (event === EVENTS.PAYMENT_COMPLETED) {
        sendSuccessNotification(data);
      } else if (event === EVENTS.BOOKING_FAILED) {
        sendFailedNotification(data);
      } else {
        console.warn(`[NotificationConsumer] ⚠️ Event không xử lý: ${event}`);
      }

      channel.ack(msg);
    } catch (err) {
      console.error('[NotificationConsumer] ❌ Lỗi xử lý message:', err.message);
      channel.nack(msg, false, false);
    }
  });
}

module.exports = { startNotificationConsumer };
