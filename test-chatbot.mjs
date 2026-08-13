import { loadEnvFile } from 'bun';

// Load .env
loadEnvFile('.env');

const apiKey = process.env['CHATBOT_API_KEY'];
const baseUrl = "https://ai.gateway.lovable.dev/v1";
const model = "google/gemini-2.5-flash";

console.log("Config:", {
  apiKeyPresent: !!apiKey,
  keyPrefix: apiKey?.slice(0, 10),
  baseUrl,
  model
});

if (!apiKey) {
  console.log("ERROR: No API key found!");
  process.exit(1);
}

console.log("\nTesting API call...");
const res = await fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model,
    messages: [{ role: 'user', content: 'Hello, this is a test. Reply briefly.' }],
    max_tokens: 50,
  }),
});

console.log("Response status:", res.status, res.statusText);
const text = await res.text();
console.log("Response body:", text.slice(0, 500));
