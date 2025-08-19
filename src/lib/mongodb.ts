import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI not found, using fallback mode');
  // In production, this should be set
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production');
  }
}

const uri = process.env.MONGODB_URI || '';
const options = {};

let client: MongoClient | undefined;
let clientPromise: Promise<MongoClient> | undefined;

if (uri) {
  // console.log(`[MongoDB] Connecting to: ${uri.split('@')[1]?.split('/')[0] || 'unknown'}`);
  // Use a global variable to preserve the connection across module reloads
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  console.warn('[MongoDB] No URI provided, cannot connect');
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise as Promise<MongoClient>;

// Helper function to get database instance
export async function getDatabase() {
  if (!clientPromise) {
    throw new Error('MongoDB connection not available');
  }
  const client = await clientPromise;
  // Extract database name from MONGODB_URI
  const dbName = process.env.MONGODB_URI?.split('/').pop()?.split('?')[0] || 'koa-chat';
  return client.db(dbName);
}

// Helper function to get collection
export async function getCollection(collectionName: string) {
  const db = await getDatabase();
  return db.collection(collectionName);
} 
