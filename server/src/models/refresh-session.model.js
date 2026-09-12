import mongoose, { Schema } from 'mongoose';

const refreshSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String, default: null },
    lastUsedAt: { type: Date, default: null },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true },
);

refreshSessionSchema.index(
  { expiresAt: 1 },
  { name: 'refreshSessionExpiresAtTtl', expireAfterSeconds: 0 },
);

export const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);
