const http = require('node:http');
const { URL } = require('node:url');
const { broker, installLoggingSubscribers } = require('./broker');
const { EVENT_TYPES } = require('./eventTypes');
const { BookingStore } = require('./bookingStore');

const PORT = Number(process.env.PORT || 8083);
const HOST = process.env.HOST || '0.0.0.0';

const store = new BookingStore();
installLoggingSubscribers();

function formatBookingId(sequence) {
  return `B${String(sequence).padStart(3, '0')}`;
}

function normalizeBookingId(id) {
  const decoded = decodeURIComponent(String(id));
  return decoded.startsWith('#') ? decoded.slice(1) : decoded;
}

function toDateOrNow(value) {
  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body, null, 2));
}

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function handlePreflight(req, res) {
  applyCors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  return false;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

function validateBookingInput(body) {
  const errors = [];

  if (!body.user_id && !body.userId) {
    errors.push('user_id is required');
  }

  if (!body.movie_id && !body.movieId) {
    errors.push('movie_id is required');
  }

  const seatNumbers = body.seat_numbers || body.seatNumbers;
  if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    errors.push('seat_numbers must be a non-empty array');
  }

  const totalPrice = Number(body.total_price ?? body.totalPrice);
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    errors.push('total_price must be a positive number');
  }

  return errors;
}

async function handleCreateBooking(req, res) {
  const body = await readBody(req);
  const errors = validateBookingInput(body);

  if (errors.length > 0) {
    sendJson(res, 400, { message: 'Invalid booking payload', errors });
    return;
  }

  const sequence = await store.getNextSequence();
  const booking = await store.create({
    id: formatBookingId(sequence),
    user_id: body.user_id || body.userId,
    movie_id: body.movie_id || body.movieId,
    seat_numbers: body.seat_numbers || body.seatNumbers,
    status: body.status || 'PENDING',
    total_price: Number(body.total_price ?? body.totalPrice),
    created_at: body.created_at ? toDateOrNow(body.created_at) : new Date()
  });

  await broker.publish(EVENT_TYPES.BOOKING_CREATED, {
    bookingId: booking.id,
    user_id: booking.user_id,
    movie_id: booking.movie_id,
    seat_numbers: booking.seat_numbers,
    status: booking.status,
    total_price: booking.total_price,
    created_at: booking.created_at
  });

  sendJson(res, 201, {
    message: 'Booking created successfully',
    booking
  });
}

async function handleListBookings(res) {
  const bookings = await store.list();
  sendJson(res, 200, {
    count: bookings.length,
    bookings
  });
}

async function handleGetBooking(res, id) {
  const booking = await store.findById(normalizeBookingId(id));
  if (!booking) {
    sendJson(res, 404, { message: 'Booking not found' });
    return;
  }

  sendJson(res, 200, { booking });
}

async function handleUpdateStatus(req, res, id) {
  try {
    const body = await readBody(req);
    if (!body.status) {
      sendJson(res, 400, { message: 'status is required' });
      return;
    }

    const booking = await store.updateStatus(normalizeBookingId(id), body.status);
    if (!booking) {
      sendJson(res, 404, { message: 'Booking not found' });
      return;
    }

    sendJson(res, 200, {
      message: 'Booking status updated',
      booking
    });
  } catch (error) {
    sendJson(res, 400, { message: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  if (handlePreflight(req, res)) {
    return;
  }

  applyCors(res);
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(res, 200, { status: 'ok', service: 'booking-service' });
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/bookings') {
    try {
      await handleListBookings(res);
    } catch (error) {
      sendJson(res, 500, { message: error.message || 'Internal server error' });
    }
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/bookings') {
    try {
      await handleCreateBooking(req, res);
    } catch (error) {
      sendJson(res, 500, { message: error.message || 'Internal server error' });
    }
    return;
  }

  const bookingMatch = requestUrl.pathname.match(/^\/bookings\/(.+)$/);
  if (bookingMatch && req.method === 'GET') {
    try {
      await handleGetBooking(res, bookingMatch[1]);
    } catch (error) {
      sendJson(res, 500, { message: error.message || 'Internal server error' });
    }
    return;
  }

  if (bookingMatch && req.method === 'PATCH') {
    await handleUpdateStatus(req, res, bookingMatch[1]);
    return;
  }

  sendJson(res, 404, { message: 'Route not found' });
});


server.listen(PORT, HOST, () => {
  console.log(`Booking Service running at http://${HOST}:${PORT}`);
  console.log('Endpoints: GET /health, GET /bookings, POST /bookings, GET /bookings/:id, PATCH /bookings/:id');
});
