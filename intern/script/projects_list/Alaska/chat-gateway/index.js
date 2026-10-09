import { createServer } from 'http';
import { createApp } from './src/app.js';
import { connectRedis } from './src/redis.js';
import { setupSocket } from './src/socket/index.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4001;

async function bootstrap() {
  const app = createApp();
  const httpServer = createServer(app);

  await connectRedis();
  setupSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Chat Gateway running on port ${PORT}`);
  });
}

bootstrap().catch(console.error);
