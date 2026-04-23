import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

export const runtime = 'edge';

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      messages,
      system: 'Kamu adalah Health Assistant bernama Nuri dari IPB Wellness Hub. Tugasmu adalah memberikan konsultasi kesehatan, tips fitness, dan rekomendasi nutrisi kepada pengguna. Selalu bersikap ramah, profesional, dan memberikan saran yang berdasarkan ilmu kesehatan yang valid.',
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
