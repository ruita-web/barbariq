import { config as dotenvConfig } from 'dotenv';
import { createApp } from '../src/api-app';

dotenvConfig();

const app = createApp();

export default app;
