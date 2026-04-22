// src/server.js
// Entry point - khởi động Express server + RabbitMQ consumers

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectRabbitMQ } = require('./config/rabbitmq');
const { startBookingConsumer } = require('./consumers/bookingConsumer');
const { startNotificationConsumer } = require('./consumers/notificationConsumer');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 8084;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────
app.use('/', routes);

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route không tồn tại' });
});

// ─── Khởi động server ────────────────────────────────────────
async function bootstrap() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Payment + Notification Service  (Port: ' + PORT + ')    ║');
  console.log('║   Buổi 6 – Event-Driven Architecture                 ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Kết nối RabbitMQ
  await connectRabbitMQ();

  // Khởi động consumers
  await startBookingConsumer();     // Lắng nghe BOOKING_CREATED → xử lý payment
  await startNotificationConsumer(); // Lắng nghe PAYMENT_COMPLETED → gửi thông báo

  // Khởi động HTTP server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n[Server] ✅ HTTP server đang chạy tại http://0.0.0.0:${PORT}`);
    console.log(`[Server] 📋 Endpoints:`);
    console.log(`         GET  /health                  - Health check`);
    console.log(`         GET  /payments                - Lịch sử thanh toán`);
    console.log(`         GET  /notifications           - Lịch sử thông báo`);
    console.log(`         POST /test/simulate-booking   - Test giả lập booking\n`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server] ❌ Lỗi khởi động:', err.message);
  process.exit(1);
});
