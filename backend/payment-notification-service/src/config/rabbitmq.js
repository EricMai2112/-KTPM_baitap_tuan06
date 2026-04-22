// src/config/rabbitmq.js
// Kết nối RabbitMQ và tạo channel dùng chung

const amqp = require('amqplib');

let connection = null;
let channel = null;

const EXCHANGE_NAME = process.env.EXCHANGE_NAME || 'movie_ticket_exchange';

/**
 * Khởi tạo kết nối RabbitMQ, retry tự động khi thất bại
 */
async function connectRabbitMQ(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`[RabbitMQ] Đang kết nối... (lần ${i}/${retries})`);
      connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();

      // Khai báo exchange kiểu topic để route event theo tên
      await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

      console.log('[RabbitMQ] Kết nối thành công!');

      connection.on('error', (err) => {
        console.error('[RabbitMQ] Lỗi kết nối:', err.message);
      });
      connection.on('close', () => {
        console.warn('[RabbitMQ] Kết nối bị đóng, thử kết nối lại...');
        setTimeout(() => connectRabbitMQ(), 5000);
      });

      return channel;
    } catch (err) {
      console.error(`[RabbitMQ] Thất bại lần ${i}: ${err.message}`);
      if (i < retries) {
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        console.error('[RabbitMQ] Hết số lần retry. Service vẫn chạy nhưng không có MQ.');
      }
    }
  }
}

function getChannel() {
  return channel;
}

module.exports = { connectRabbitMQ, getChannel, EXCHANGE_NAME };
