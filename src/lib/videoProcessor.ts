import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function processVideo(url: string, duration: number) {
  const segments = await detectHighlights(duration);
  return segments;
}

async function detectHighlights(duration: number) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  const prompt = `Generate 10 interesting clip segments for a ${duration} second video.
    Each clip should be 15-30 seconds long.
    Return a valid JSON array of objects with "start" and "end" times in seconds.
    Example format: [{"start": 0, "end": 15}, {"start": 45, "end": 70}]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    
    // Clean response to ensure valid JSON
    const cleanJson = response.replace(/```json\n|\n```/g, '').trim();
    
    const segments = JSON.parse(cleanJson);
    
    // Validate segment format
    if (!Array.isArray(segments)) {
      throw new Error('Invalid segments format - expected array');
    }
    
    return segments.map(segment => ({
      start: Number(segment.start),
      end: Number(segment.end)
    }));
    
  } catch (error) {
    console.error('AI processing error:', error);
    throw new Error('Failed to generate video segments');
  }
}