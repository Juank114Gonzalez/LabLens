import { createApp } from './app.js';
import { env } from './config/env.js';

const HOST = '0.0.0.0';
const app = createApp();

app.listen(env.PORT, HOST, () => {
  console.log(`Backend listening on ${HOST}:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
