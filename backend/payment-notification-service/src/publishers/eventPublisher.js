// src/publishers/eventPublisher.js
// Publish event lên RabbitMQ exchange

const { getChannel, EXCHANGE_NAME } = require('../config/rabbitmq');

/**
 * Publish một event lên exchange
 * @param {string} eventType - Tên event (vd: PAYMENT_COMPLETED)
 * @param {object} payload   - Dữ liệu kèm theo
 */
function publishEvent(eventType, payload) {
  const channel = getChannel();

  if (!channel) {
    console.warn(`[Publisher] Chưa có channel, bỏ qua event: ${eventType}`);
    return;
  }

  const message = JSON.stringify({
    event: eventType,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  // routing key = tên event (viết thường) để subscriber filter dễ
  const routingKey = eventType.toLowerCase();

  channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(message), {
    persistent: true, // message không mất khi RabbitMQ restart
  });

  console.log(`[Publisher] ✅ Published event [${eventType}]:`, payload);
}

module.exports = { publishEvent };
