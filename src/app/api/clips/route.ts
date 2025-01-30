import { NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';
import { exec } from 'child_process';
import { mkdir } from 'fs/promises';
import path from 'path';
import util from 'util';

const execAsync = util.promisify(exec);
const CLIPS_DIR = path.join(process.cwd(), 'public', 'clips');
const FFMPEG_PATH = process.env.FFMPEG_PATH || 'C:\\ffmpeg\\bin\\ffmpeg.exe';

async function checkFFmpeg() {
  try {
    await execAsync(`"${FFMPEG_PATH}" -version`);
    return true;
  } catch (error) {
    console.error('FFmpeg not found:', error);
    return false;
  }
}

async function ensureClipsDirectory() {
  try {
    await mkdir(CLIPS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating clips directory:', error);
  }
}

async function generateClip(videoUrl: string, start: number, end: number, outputPath: string) {
  const command = `"${FFMPEG_PATH}" -i "${videoUrl}" -ss ${start} -t ${end - start} -c copy "${outputPath}"`;
  await execAsync(command);
}

export async function POST(req: Request) {
  try {
    if (!await checkFFmpeg()) {
      return NextResponse.json({ 
        error: 'FFmpeg not installed or not found. Please install FFmpeg and set FFMPEG_PATH environment variable.' 
      }, { status: 500 });
    }
    
    const { videoUrl, segments } = await req.json();

    if (!videoUrl || !segments || !Array.isArray(segments)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await ensureClipsDirectory();

    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highest',
      filter: 'audioandvideo' 
    });

    const clipPromises = segments.map(async (segment, index) => {
      const clipName = `${info.videoDetails.videoId}-${index}.mp4`;
      const clipPath = path.join(CLIPS_DIR, clipName);
      
      await generateClip(format.url, segment.start, segment.end, clipPath);
      return `/clips/${clipName}`;
    });

    const clipUrls = await Promise.all(clipPromises);

    return NextResponse.json({
      clips: clipUrls,
      metadata: {
        videoId: info.videoDetails.videoId,
        duration: parseInt(info.videoDetails.lengthSeconds)
      }
    });

  } catch (error) {
    console.error('Clips generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate clips',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}