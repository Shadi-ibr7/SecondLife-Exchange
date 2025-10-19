import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  geminiApiKey: process.env.AI_GEMINI_API_KEY,
  geminiModel: process.env.AI_GEMINI_MODEL || 'gemini-2.5-flash',
  geminiTimeout: parseInt(process.env.AI_GEMINI_TIMEOUT_MS || '10000'),
  geminiMaxRetries: parseInt(process.env.AI_GEMINI_MAX_RETRIES || '1'),
  geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
}));
