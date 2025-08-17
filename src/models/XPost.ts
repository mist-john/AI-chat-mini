import mongoose, { Schema, Document } from 'mongoose';

export interface IXPost extends Document {
  postId: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  retweets: number;
  replies: number;
  url: string;
  hashtags: string[];
  mentions: string[];
  isRetweet: boolean;
  isReply: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const XPostSchema = new Schema<IXPost>({
  postId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    index: true
  },
  author: {
    type: String,
    required: true,
    default: 'koasync'
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  likes: {
    type: Number,
    default: 0
  },
  retweets: {
    type: Number,
    default: 0
  },
  replies: {
    type: Number,
    default: 0
  },
  url: {
    type: String,
    required: true
  },
  hashtags: [{
    type: String,
    index: true
  }],
  mentions: [{
    type: String
  }],
  isRetweet: {
    type: Boolean,
    default: false
  },
  isReply: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// -----------------------------Create text index for semantic search-----------------------------//
XPostSchema.index({ content: 'text', hashtags: 'text' });

export default mongoose.models.XPost || mongoose.model<IXPost>('XPost', XPostSchema);
