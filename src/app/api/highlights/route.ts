import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

interface Highlight {
  start: number;
  end: number;
}

export async function POST(req: Request) {
  try {
    const { transcript, duration } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a JSON API that analyzes video transcripts.
    Your task is to identify 10 interesting segments from this ${duration} second video.
    
    REQUIREMENTS:
    - Output must be ONLY a valid JSON array
    - Each object must have "start" and "end" numbers
    - Clips must be 10-30 seconds long
    - All timestamps must be within ${duration} seconds
    - Do not include any explanations or text outside the JSON
    
    Example output:
    [{"start":10,"end":25},{"start":45,"end":60}]
    
    Analyze this transcript and return clips: ${transcript}`;

    console.log('Sending prompt to AI...');
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    console.log('AI Response:', text);

    // Remove any non-JSON content
    const jsonStr = text.replace(/^[\s\S]*?(\[[\s\S]*\])[\s\S]*$/, '$1');
    console.log('Extracted JSON:', jsonStr);

    try {
      const highlights = JSON.parse(jsonStr) as Highlight[];
      
      if (!Array.isArray(highlights)) {
        throw new Error('Response is not an array');
      }

      // Validate highlights
      const validHighlights = highlights.filter(h => 
        typeof h.start === 'number' &&
        typeof h.end === 'number' &&
        h.start >= 0 &&
        h.end <= duration &&
        h.end - h.start >= 10 &&
        h.end - h.start <= 30
      );

      return NextResponse.json({ highlights: validHighlights });

    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

  } catch (error) {
    console.error('Highlight detection error:', error);
    return NextResponse.json({ 
      error: 'Failed to detect highlights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}