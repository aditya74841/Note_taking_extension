import mongoose, { Schema } from 'mongoose';

const pinSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    urlKey: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    fullUrl: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Number,
      default: () => Date.now(),
    },
  },
  {
    timestamps: true,
  },
);

pinSchema.index({ userId: 1, domain: 1 }, { unique: true });

export const DomainPin = mongoose.model('DomainPin', pinSchema);
