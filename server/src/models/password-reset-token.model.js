import mongoose, { Schema } from 'mongoose';

const passwordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

passwordResetTokenSchema.index(
  { expiresAt: 1 },
  { name: 'passwordResetExpiresAtTtl', expireAfterSeconds: 0 },
);

export const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
