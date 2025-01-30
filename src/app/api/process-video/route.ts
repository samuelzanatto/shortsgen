import { NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();
    
    if (!ytdl.validateURL(videoUrl)) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highestvideo',
      filter: 'audioandvideo'
    });

    return NextResponse.json({
      videoId: info.videoDetails.videoId,
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[0].url,
      duration: parseInt(info.videoDetails.lengthSeconds),
      downloadUrl: format.url
    });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process video'
    }, { status: 422 });
  }
}