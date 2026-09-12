import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { isDatabaseReady } from './config/db.js';
import { API_LIMITS, API_VERSION_PREFIX } from './utils/api.constants.js';
import { ApiResponse } from './utils/ApiResponse.js';
import { requestLogger } from './middlewares/request-logger.middleware.js';
import authRouter from './routes/auth.routes.js';
import noteRouter from './routes/note.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

function createCorsOptions() {
  const allowAllOrigins = config.corsOrigins.includes('*');

  return {
    origin(origin, callback) {
      if (!origin || allowAllOrigins || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: false,
  };
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.nodeEnv === 'staging' || config.nodeEnv === 'production');
  app.use(requestLogger);
  app.use(helmet());
  app.use(cors(createCorsOptions()));

  // Keep request bodies bounded; oversized bodies receive HTTP 413 from Express.
  app.use(express.json({ limit: API_LIMITS.requestBodyBytes }));
  app.use(express.urlencoded({ extended: true, limit: API_LIMITS.requestBodyBytes }));

  const sendHealthResponse = (res, statusCode, data, message) => {
    res.setHeader('Cache-Control', 'no-store');
    res.status(statusCode).json(new ApiResponse(statusCode, data, message));
  };

  // Main root route — server overview and status
  app.get('/', (req, res) => {
    res.status(200).json(
      new ApiResponse(
        200,
        {
          name: 'WebMemo API',
          description: 'Backend API server for WebMemo Chrome Extension',
          version: config.appVersion,
          environment: config.nodeEnv,
          database: isDatabaseReady() ? 'connected' : 'disconnected',
          endpoints: {
            health: `${API_VERSION_PREFIX}/health/ready`,
            auth: `${API_VERSION_PREFIX}/auth`,
            notes: `${API_VERSION_PREFIX}/notes`,
          },
        },
        'WebMemo API Server is running successfully',
      ),
    );
  });

  // Liveness confirms that the Node process is running.
  app.get(`${API_VERSION_PREFIX}/health/live`, (req, res) => {
    sendHealthResponse(
      res,
      200,
      {
        status: 'ok',
        service: 'url-notes-backend',
        version: config.appVersion,
        environment: config.nodeEnv,
      },
      'Service is alive',
    );
  });

  // Keep the original health route as a backwards-compatible liveness alias.
  app.get(`${API_VERSION_PREFIX}/health`, (req, res) => {
    sendHealthResponse(
      res,
      200,
      {
        status: 'ok',
        service: 'url-notes-backend',
        version: config.appVersion,
        environment: config.nodeEnv,
      },
      'Service is alive',
    );
  });

  // Readiness confirms that required dependencies are available.
  app.get(`${API_VERSION_PREFIX}/health/ready`, (req, res) => {
    const databaseReady = isDatabaseReady();

    if (!databaseReady) {
      sendHealthResponse(
        res,
        503,
        {
          status: 'not_ready',
          service: 'url-notes-backend',
          version: config.appVersion,
          environment: config.nodeEnv,
          database: 'disconnected',
        },
        'Service is not ready',
      );
      return;
    }

    sendHealthResponse(
      res,
      200,
      {
        status: 'ready',
        service: 'url-notes-backend',
        version: config.appVersion,
        environment: config.nodeEnv,
        database: 'connected',
      },
      'Service is ready',
    );
  });

  // Routes declaration
  app.use(`${API_VERSION_PREFIX}/auth`, authRouter);
  app.use(`${API_VERSION_PREFIX}/notes`, noteRouter);

  // Unknown routes must use the same response contract as other errors.
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
