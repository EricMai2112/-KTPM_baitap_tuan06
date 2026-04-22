const { EventEmitter } = require('node:events');
const { EVENT_TYPES } = require('./eventTypes');

class LocalEventBroker {
  constructor() {
    this.emitter = new EventEmitter();
    this.history = [];
  }

  async publish(type, payload) {
    const event = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      payload,
      createdAt: new Date().toISOString()
    };

    this.history.push(event);
    this.emitter.emit(type, event);
    console.log(`[event] ${type}`, JSON.stringify(event.payload));
    return event;
  }

  subscribe(type, handler) {
    this.emitter.on(type, handler);
    return () => this.emitter.off(type, handler);
  }

  getHistory() {
    return [...this.history];
  }
}

const broker = new LocalEventBroker();

function installLoggingSubscribers() {
  broker.subscribe(EVENT_TYPES.BOOKING_CREATED, (event) => {
    console.log(`[booking-service] published ${event.type} for booking #${event.payload.bookingId}`);
  });
}

module.exports = {
  broker,
  installLoggingSubscribers,
  LocalEventBroker
};
