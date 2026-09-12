import mongoose, { Schema } from 'mongoose';

const noteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    urlKey: {
      type: String,
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    fullUrl: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      enum: ['default', 'red', 'yellow', 'green', 'purple', 'blue'],
      default: 'default',
    },
    updatedAt: {
      type: Number,
      default: () => Date.now(),
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for fast user + urlKey lookups
noteSchema.index({ userId: 1, urlKey: 1 }, { unique: true });

export const Note = mongoose.model('Note', noteSchema);
