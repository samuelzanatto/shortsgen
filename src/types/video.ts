export interface VideoSegment {
  start: number;
  end: number;
  path: string;
}

export interface ProcessedVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number;
  downloadUrl: string;
  segments: VideoSegment[];
}

export interface Highlight {
  start: number;
  end: number;
  confidence: number;
}