import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Allow selecting model via environment variable or a feature flag.
// To enable GPT-5 for all clients set ENABLE_GPT5=true in the environment.
const enableGpt5 = (process.env.ENABLE_GPT5 || '').toLowerCase() === 'true';

// Default model when GPT-5 is not enabled
const DEFAULT_MODEL = 'googleai/gemini-2.5-flash';

// If ENABLE_GPT5 is true, use a GPT-5 model id. Adjust to your provider's canonical id.
const GPT5_MODEL = process.env.AI_GPT5_MODEL || 'openai/gpt-5';

const selectedModel = enableGpt5 ? GPT5_MODEL : DEFAULT_MODEL;

if (enableGpt5) {
  // eslint-disable-next-line no-console
  console.warn(`[ai] ENABLE_GPT5 is true — using model: ${selectedModel}`);
}

export const ai = genkit({
  plugins: [googleAI()],
  model: selectedModel,
});

export const isGpt5Enabled = enableGpt5;
