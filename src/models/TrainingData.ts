import { ObjectId } from 'mongodb';

export interface ITrainingData {
  _id?: ObjectId;
  userId: string;
  sessionId: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    analysis?: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    trainingPurpose?: string;
  };
}

export interface ITrainingDataCreate {
  userId: string;
  sessionId: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    analysis?: string;
  }[];
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    trainingPurpose?: string;
  };
}

export class TrainingData {
  static readonly COLLECTION_NAME = 'training_data';

  static async create(trainingData: ITrainingDataCreate): Promise<ITrainingData> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    const now = new Date();
    const data: ITrainingData = {
      ...trainingData,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(data);
    return { ...data, _id: result.insertedId };
  }

  static async addMessage(sessionId: string, message: {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
    analysis?: string;
  }): Promise<boolean> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    const messageToAdd = {
      ...message,
      timestamp: new Date()
    };

    const result = await collection.updateOne(
      { sessionId, isActive: true },
      { 
        $push: { messages: messageToAdd },
        $set: { updatedAt: new Date() }
      } as any
    );

    return result.modifiedCount > 0;
  }

  static async getBySessionId(sessionId: string): Promise<ITrainingData | null> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    return await collection.findOne({ sessionId, isActive: true }) as ITrainingData | null;
  }

  static async getAll(): Promise<ITrainingData[]> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    return await collection.find({ isActive: true }).sort({ createdAt: -1 }).toArray() as ITrainingData[];
  }

  static async getByUserId(userId: string): Promise<ITrainingData[]> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    return await collection.find({ userId, isActive: true }).sort({ createdAt: -1 }).toArray() as ITrainingData[];
  }

  static async delete(id: string): Promise<boolean> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    return result.modifiedCount > 0;
  }
}
