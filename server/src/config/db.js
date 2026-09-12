import mongoose from 'mongoose';
import { config } from './env.js';
import { User } from '../models/user.model.js';
import { Note } from '../models/note.model.js';
import { DomainPin } from '../models/pin.model.js';
import { RefreshSession } from '../models/refresh-session.model.js';
import { PasswordResetToken } from '../models/password-reset-token.model.js';
import { logger } from '../utils/logger.js';

const connectionOptions = {
  serverSelectionTimeoutMS: 5_000,
  connectTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  maxPoolSize: 10,
  minPoolSize: config.nodeEnv === 'production' ? 2 : 0,
};

const requiredUniqueIndexes = [
  { model: Note, name: 'userId_1_urlKey_1' },
  { model: DomainPin, name: 'userId_1_domain_1' },
];

function validateProductionDatabaseUri() {
  if (config.nodeEnv === 'production' && /localhost|127\.0\.0\.1|::1/i.test(config.mongodbUri)) {
    throw new Error('Production MongoDB configuration cannot use a local database host');
  }
}

async function verifyIndexes() {
  await Promise.all([
    User.init(),
    Note.init(),
    DomainPin.init(),
    RefreshSession.init(),
    PasswordResetToken.init(),
  ]);

  for (const model of [RefreshSession, PasswordResetToken]) {
    try {
      const indexes = await model.collection.listIndexes().toArray();
      const legacyIndex = indexes.find(
        (candidate) =>
          candidate.name === 'expiresAt_1' && candidate.expireAfterSeconds === undefined,
      );
      if (legacyIndex) await model.collection.dropIndex(legacyIndex.name);
    } catch (err) {
      if (err.code !== 26 && !err.message?.includes('ns does not exist')) {
        throw err;
      }
    }
  }

  for (const { model, name } of requiredUniqueIndexes) {
    try {
      const indexes = await model.collection.listIndexes().toArray();
      const index = indexes.find((candidate) => candidate.name === name);

      if (!index?.unique) {
        throw new Error(
          `Required unique index is missing or not unique: ${model.modelName}.${name}`,
        );
      }
    } catch (err) {
      if (err.code !== 26 && !err.message?.includes('ns does not exist')) {
        throw err;
      }
    }
  }

  logger.info({ event: 'mongodb.indexes_verified' }, 'MongoDB indexes verified');
}

mongoose.connection.on('disconnected', () => {
  logger.error({ event: 'mongodb.disconnected' }, 'MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info({ event: 'mongodb.reconnected' }, 'MongoDB reconnected');
});

const connectDB = async () => {
  validateProductionDatabaseUri();

  try {
    const connectionInstance = await mongoose.connect(config.mongodbUri, connectionOptions);
    logger.info(
      { event: 'mongodb.connected', host: connectionInstance.connection.host },
      'MongoDB connected',
    );
    await verifyIndexes();
    return connectionInstance;
  } catch (error) {
    await mongoose.disconnect().catch(() => undefined);
    throw new Error(`MongoDB connection failed: ${error.message}`, { cause: error });
  }
};

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info({ event: 'mongodb.closed' }, 'MongoDB connection closed');
  }
}

export default connectDB;
