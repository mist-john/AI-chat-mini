import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Check if we're in a build environment
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && !MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable for production deployment');
  }

  // If no MongoDB URI is provided, return a mock connection for development
  if (!MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI not found. Using mock connection for development.');
    console.warn('💡 To enable real MongoDB:');
    console.warn('   1. Go to https://www.mongodb.com/atlas');
    console.warn('   2. Create a free cluster');
    console.warn('   3. Set MONGODB_URI environment variable');
    
    // Create a more complete mock that mimics mongoose behavior
    const mockConnection = {
      connection: { 
        readyState: 0,
        host: 'localhost',
        port: 27017,
        name: 'mock-database'
      },
      models: {},
      model: (name: string) => {
        // Return a mock model with basic methods that the app expects
        return {
          find: () => Promise.resolve([]),
          findOne: () => Promise.resolve(null),
          create: (data: any) => Promise.resolve(data),
          updateOne: () => Promise.resolve({ modifiedCount: 0 }),
          deleteOne: () => Promise.resolve({ deletedCount: 0 }),
          countDocuments: () => Promise.resolve(0),
          aggregate: () => Promise.resolve([]),
          // Add the specific methods that Client model needs
          findOrCreateClient: async (clientId: string, ipAddress?: string, userAgent?: string) => {
            // Mock client object with required methods
            return {
              clientId,
              messageCount: 0,
              lastReset: new Date(),
              ipAddress,
              userAgent,
              canSendMessage: () => true,
              incrementMessageCount: () => {},
              save: () => Promise.resolve(),
            };
          },
          // Add other common mongoose methods as needed
        };
      },
      disconnect: () => Promise.resolve(),
      // Add other mongoose methods that might be called
      startSession: () => Promise.resolve({}),
      transaction: () => Promise.resolve({}),
    };
    
    return mockConnection as any;
  }

  // Validate MongoDB URI format
  if (!MONGODB_URI.includes('mongodb+srv://') || !MONGODB_URI.includes('.mongodb.net')) {
    console.error('❌ Invalid MongoDB URI format detected!');
    console.error('Your URI should look like: mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database');
    console.error('Current URI:', MONGODB_URI);
    console.warn('⚠️ Using mock connection due to invalid MongoDB URI format');
    
    // Return mock connection instead of failing
    const mockConnection = {
      connection: { readyState: 0, host: 'localhost', port: 27017, name: 'mock-database' },
      models: {},
      model: (name: string) => ({
        find: () => Promise.resolve([]),
        findOne: () => Promise.resolve(null),
        create: (data: any) => Promise.resolve(data),
        updateOne: () => Promise.resolve({ modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 }),
        countDocuments: () => Promise.resolve(0),
        aggregate: () => Promise.resolve([]),
        findOrCreateClient: async (clientId: string, ipAddress?: string, userAgent?: string) => ({
          clientId, messageCount: 0, lastReset: new Date(), ipAddress, userAgent,
          canSendMessage: () => true, incrementMessageCount: () => {}, save: () => Promise.resolve(),
        }),
      }),
      disconnect: () => Promise.resolve(),
      startSession: () => Promise.resolve({}),
      transaction: () => Promise.resolve({}),
    };
    
    return mockConnection as any;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Connected to MongoDB Atlas successfully');
      return mongoose;
    }).catch((error) => {
      console.error('❌ MongoDB connection error:', error);
      console.error('Please check your MONGODB_URI environment variable');
      console.error('Expected format: mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database');
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export { connectDB as connectToDatabase };
export default connectDB;
