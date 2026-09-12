import { pathToFileURL } from 'node:url';
import { config } from './src/config/env.js';
import connectDB, { disconnectDB } from './src/config/db.js';
import { createApp } from './src/app.js';
import { logger } from './src/utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;
let activeServer;
let shutdownPromise;

export async function startServer() {
  await connectDB();

  const app = createApp();
  try {
    activeServer = await new Promise((resolve, reject) => {
      const server = app.listen(config.port, config.host, () => {
        logger.info(
          { event: 'server.listening', host: config.host, port: config.port },
          'Server listening',
        );
        resolve(server);
      });

      server.once('error', reject);
    });
  } catch (error) {
    activeServer = undefined;
    await disconnectDB().catch(() => undefined);
    throw error;
  }

  return activeServer;
}

export async function shutdownServer(signal = 'unknown') {
  if (shutdownPromise) return shutdownPromise;

  shutdownPromise = (async () => {
    logger.info({ event: 'server.shutdown_started', signal }, 'Server shutdown started');

    let timeout;
    try {
      await Promise.race([
        new Promise((resolve, reject) => {
          if (!activeServer) {
            resolve();
            return;
          }

          activeServer.close((error) => {
            if (error && error.code !== 'ERR_SERVER_NOT_RUNNING') {
              reject(error);
              return;
            }
            resolve();
          });

          // Stop idle keep-alive sockets while allowing active requests to finish.
          activeServer.closeIdleConnections?.();
        }),
        new Promise((_, reject) => {
          timeout = setTimeout(() => {
            activeServer?.closeAllConnections?.();
            reject(new Error(`Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms`));
          }, SHUTDOWN_TIMEOUT_MS);
          timeout.unref();
        }),
      ]);

      await disconnectDB();
      logger.info({ event: 'server.shutdown_completed' }, 'Server shutdown completed');
      return 0;
    } catch (error) {
      logger.error(
        { event: 'server.shutdown_failed', error: error.message },
        'Server shutdown failed',
      );
      await disconnectDB().catch(() => undefined);
      return 1;
    } finally {
      clearTimeout(timeout);
      activeServer = undefined;
    }
  })();

  return shutdownPromise;
}

function installShutdownHandlers() {
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.once(signal, async () => {
      const exitCode = await shutdownServer(signal);
      process.exitCode = exitCode;
    });
  }
}

const isMainModule = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMainModule) {
  installShutdownHandlers();

  startServer().catch((error) => {
    logger.fatal(
      { event: 'server.startup_failed', error: error.message },
      'Server failed to start',
    );
    process.exitCode = 1;
  });
}
