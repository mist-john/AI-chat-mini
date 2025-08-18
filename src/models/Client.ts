import { ObjectId } from 'mongodb';

export interface IClient {
  _id?: ObjectId;
  clientId: string;
  messageCount: number;
  lastReset: number;
  createdAt: Date;
  updatedAt: Date;
  userAgent?: string;
  ipAddress?: string;
  lastActive: Date;
  totalMessages: number;
  isActive: boolean;
}

export interface IClientCreate {
  clientId: string;
  messageCount?: number;
  lastReset?: number;
  userAgent?: string;
  ipAddress?: string;
}

export class Client {
  static readonly COLLECTION_NAME = 'clients';
  static readonly DAILY_MESSAGE_LIMIT = 100;
  static readonly RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  static async create(clientData: IClientCreate): Promise<IClient> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    const now = new Date();
    const client: IClient = {
      clientId: clientData.clientId,
      messageCount: clientData.messageCount || 0,
      lastReset: clientData.lastReset || now.getTime(),
      createdAt: now,
      updatedAt: now,
      userAgent: clientData.userAgent,
      ipAddress: clientData.ipAddress,
      lastActive: now,
      totalMessages: 0,
      isActive: true,
    };

    const result = await collection.insertOne(client);
    return { ...client, _id: result.insertedId };
  }

  static async findByClientId(clientId: string): Promise<IClient | null> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    return await collection.findOne({ clientId }) as IClient | null;
  }

  static async updateMessageCount(clientId: string, increment: number = 1): Promise<IClient | null> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    const now = new Date();
    const updateData: any = {
      $inc: { 
        messageCount: increment,
        totalMessages: increment 
      },
      $set: { 
        updatedAt: now,
        lastActive: now
      }
    };

    // Check if we need to reset the daily count
    const client = await this.findByClientId(clientId);
    if (client) {
      const timeSinceReset = now.getTime() - client.lastReset;
      if (timeSinceReset >= this.RESET_INTERVAL) {
        updateData.$set.lastReset = now.getTime();
        updateData.$set.messageCount = increment; // Reset to current increment
      }
    }

    const result = await collection.findOneAndUpdate(
      { clientId },
      updateData,
      { returnDocument: 'after' }
    );

    return result as IClient | null;
  }

  static async canSendMessage(clientId: string): Promise<boolean> {
    const client = await this.findByClientId(clientId);
    if (!client) return true; // New client can send messages

    const now = Date.now();
    const timeSinceReset = now - client.lastReset;

    // If it's been more than 24 hours, reset the count
    if (timeSinceReset >= this.RESET_INTERVAL) {
      return true;
    }

    // Check if under daily limit
    return client.messageCount < this.DAILY_MESSAGE_LIMIT;
  }

  static async getClientStatus(clientId: string): Promise<{
    canSendMessage: boolean;
    messageCount: number;
    dailyLimit: number;
    timeUntilReset: number;
    isNewClient: boolean;
  }> {
    const client = await this.findByClientId(clientId);
    const now = Date.now();

    if (!client) {
      return {
        canSendMessage: true,
        messageCount: 0,
        dailyLimit: this.DAILY_MESSAGE_LIMIT,
        timeUntilReset: 0,
        isNewClient: true,
      };
    }

    const timeSinceReset = now - client.lastReset;
    const timeUntilReset = Math.max(0, this.RESET_INTERVAL - timeSinceReset);
    const canSendMessage = client.messageCount < this.DAILY_MESSAGE_LIMIT;

    return {
      canSendMessage,
      messageCount: client.messageCount,
      dailyLimit: this.DAILY_MESSAGE_LIMIT,
      timeUntilReset,
      isNewClient: false,
    };
  }

  static async deactivateClient(clientId: string): Promise<boolean> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    const result = await collection.updateOne(
      { clientId },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    return result.modifiedCount > 0;
  }

  static async getActiveClients(): Promise<IClient[]> {
    const { getCollection } = await import('../lib/mongodb');
    const collection = await getCollection(this.COLLECTION_NAME);

    return await collection.find({ isActive: true }).toArray() as IClient[];
  }
} 
