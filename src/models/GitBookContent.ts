import mongoose, { Schema, Document } from 'mongoose';

export interface IGitBookContent extends Document {
  title: string;
  content: string;
  section: string;
  url: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const GitBookContentSchema = new Schema<IGitBookContent>({
  title: { type: String, required: true, index: true },
  content: { type: String, required: true, index: true },
  section: { type: String, required: true, index: true },
  url: { type: String, required: true },
  order: { type: Number, required: true, default: 0 },
}, { timestamps: true });

// Create text index for content and title search
GitBookContentSchema.index({ content: 'text', title: 'text', section: 'text' });

export default mongoose.models.GitBookContent || mongoose.model<IGitBookContent>('GitBookContent', GitBookContentSchema);
