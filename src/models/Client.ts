import mongoose, { Document, Model } from 'mongoose';

export interface IClient extends Document {
  clientId: string;
  messageCount: number;
  lastReset: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  canSendMessage(): boolean;
  incrementMessageCount(): void;
}

export interface IClientModel extends Model<IClient> {
  findOrCreateClient(clientId: string, ipAddress?: string, userAgent?: string): Promise<IClient>;
}

const ClientSchema = new mongoose.Schema<IClient, IClientModel>(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    messageCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastReset: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ClientSchema.index({ lastReset: 1 });

// Instance method to check if client can send messages
ClientSchema.methods.canSendMessage = function(): boolean {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  // Check if it's been more than 24 hours since last reset
  if (now.getTime() - this.lastReset.getTime() > oneDay) {
    return true; // Can send message, will reset
  }
  
  // Check if message limit is reached
  return this.messageCount < 100;
};

// Instance method to increment message count
ClientSchema.methods.incrementMessageCount = function(): void {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  
  // Check if it's been more than 24 hours since last reset
  if (now.getTime() - this.lastReset.getTime() > oneDay) {
    // Reset message count and update lastReset
    this.messageCount = 1;
    this.lastReset = now;
  } else {
    // Increment message count
    this.messageCount += 1;
  }
};

// Static method to find or create client
ClientSchema.statics.findOrCreateClient = async function(
  clientId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<IClient> {
  let client = await this.findOne({ clientId });
  
  if (!client) {
    client = new this({
      clientId,
      messageCount: 0,
      lastReset: new Date(),
      ipAddress,
      userAgent,
    });
    await client.save();
  }
  
  return client;
};

export default mongoose.models.Client || mongoose.model<IClient, IClientModel>('Client', ClientSchema);
