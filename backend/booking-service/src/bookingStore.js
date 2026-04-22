const { MongoClient } = require('mongodb');

class BookingStore {
  constructor() {
    this.client = null;
    this.collection = null;
  }

  normalizeBooking(booking) {
    if (!booking) {
      return null;
    }

    const normalized = { ...booking };
    delete normalized._id;
    return normalized;
  }

  async connect() {
    if (this.collection) {
      return this.collection;
    }

    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://phong:12345@cluster0.imaiqbv.mongodb.net/?appName=Cluster0';
    const databaseName = process.env.MONGODB_DB || 'movie_ticket';
    const collectionName = process.env.MONGODB_COLLECTION || 'bookings';

    this.client = new MongoClient(mongoUri);
    await this.client.connect();

    const database = this.client.db(databaseName);
    this.collection = database.collection(collectionName);
    await this.collection.createIndex({ id: 1 }, { unique: true });
    return this.collection;
  }

  async getNextSequence() {
    const collection = await this.connect();
    const count = await collection.countDocuments();
    return count + 1;
  }

  async create(data) {
    const collection = await this.connect();
    const booking = {
      id: data.id,
      user_id: String(data.user_id),
      movie_id: String(data.movie_id),
      seat_numbers: Array.isArray(data.seat_numbers) ? data.seat_numbers : [],
      status: data.status || 'PENDING',
      total_price: Number(data.total_price),
      created_at: data.created_at || new Date()
    };

    await collection.insertOne(booking);
    return this.normalizeBooking(booking);
  }

  async list() {
    const collection = await this.connect();
    const bookings = await collection.find({}, { sort: { created_at: -1 } }).toArray();
    return bookings.map((booking) => this.normalizeBooking(booking));
  }

  async findById(id) {
    const collection = await this.connect();
    const booking = await collection.findOne({ id: String(id) });
    return this.normalizeBooking(booking);
  }

  async updateStatus(id, status) {
    const collection = await this.connect();
    const result = await collection.findOneAndUpdate(
      { id: String(id) },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    return this.normalizeBooking(result.value);
  }
}

module.exports = { BookingStore };
