# Payment + Notification Service
> Buổi 6 – Event-Driven Architecture | Người 5

## Cấu trúc thư mục

```
payment-notification-service/
├── src/
│   ├── config/
│   │   └── rabbitmq.js          # Kết nối RabbitMQ
│   ├── constants/
│   │   └── events.js            # Tên các event
│   ├── consumers/
│   │   ├── bookingConsumer.js   # Lắng nghe BOOKING_CREATED → xử lý payment
│   │   └── notificationConsumer.js # Lắng nghe PAYMENT_COMPLETED → thông báo
│   ├── publishers/
│   │   └── eventPublisher.js    # Publish event lên RabbitMQ
│   ├── services/
│   │   ├── payment.service.js   # Logic xử lý thanh toán (random success/fail)
│   │   └── notification.service.js # Logic gửi thông báo (console log)
│   ├── routes/
│   │   └── index.js             # REST API endpoints
│   └── server.js                # Entry point
├── .env
├── Dockerfile
└── package.json
```

## Luồng xử lý

```
Booking Service
    │
    │ Publish: BOOKING_CREATED
    ▼
[RabbitMQ Exchange: movie_ticket_exchange]
    │
    ├──► bookingConsumer (Payment Service)
    │         │ random success/fail
    │         │ Publish: PAYMENT_COMPLETED / BOOKING_FAILED
    │         ▼
    │    [RabbitMQ Exchange]
    │         │
    └──►      ▼
         notificationConsumer (Notification Service)
                   │
                   └──► Console log thông báo
```

## Cài đặt & chạy

### 1. Cài dependencies
```bash
npm install
```

### 2. Cấu hình .env
```env
PORT=8084
RABBITMQ_URL=amqp://guest:guest@<IP_RABBITMQ>:5672
BOOKING_SERVICE_URL=http://<IP_BOOKING_SERVICE>:8083
EXCHANGE_NAME=movie_ticket_exchange
QUEUE_BOOKING_CREATED=booking_created_queue
QUEUE_NOTIFICATION=notification_queue
```

### 3. Chạy service
```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

## Test thủ công (không cần Booking Service)

```bash
# Giả lập một booking được tạo
curl -X POST http://localhost:8084/test/simulate-booking \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BK-001",
    "userId": "user-123",
    "movieId": "movie-456",
    "seats": ["A1", "A2"],
    "totalAmount": 150000
  }'

# Xem lịch sử payment
curl http://localhost:8084/payments

# Xem lịch sử thông báo
curl http://localhost:8084/notifications
```

## Lưu ý quan trọng

- **KHÔNG** gọi trực tiếp Booking Service để nhận booking
- **CHỈ** nhận qua event `BOOKING_CREATED` từ RabbitMQ
- Payment Service và Notification Service chạy **trong cùng 1 process** nhưng hoàn toàn tách biệt nhau về logic
- Service vẫn khởi động được dù RabbitMQ chưa sẵn sàng (retry tự động)
