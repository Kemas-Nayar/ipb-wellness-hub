// File: api/chat.js
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.VITE_GEMINI_API_KEY || '',
});

// gunakan Web API handler
export const runtime = 'edge';

export async function POST(req) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google('gemini-2.0-flash'),
    messages,
    system: 'Kamu adalah Health Assistant bernama Nuri dari IPB Wellness Hub...',
  });

  return result.toDataStreamResponse();
}
