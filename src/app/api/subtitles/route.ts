import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { audioContent } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Generate subtitles for this audio content. Format as SRT:
    ${audioContent}`;

    const result = await model.generateContent(prompt);
    const subtitles = await result.response.text();

    return NextResponse.json({ subtitles });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate subtitles' }, { status: 500 });
  }
}