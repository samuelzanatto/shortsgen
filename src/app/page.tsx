"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { useState } from "react"
import Image from "next/image"

const formSchema = z.object({
  videoUrl: z.string().url('Please enter a valid YouTube URL'),
});

export default function Home() {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [clips, setClips] = useState<string[]>([]);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { videoUrl: '' }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsProcessing(true);
      setProgress('Processing video...');
      
      // Initial video processing
      const response = await fetch('/api/process-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: values.videoUrl }),
      });

      const data = await response.json();
      setThumbnail(data.thumbnail);
      
      // Generate highlights
      setProgress('Analyzing content...');
      const highlightsResponse = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId: data.videoId,
          duration: data.duration 
        }),
      });
      
      const { highlights } = await highlightsResponse.json();
      
      // Generate clips
      setProgress('Generating clips...');
      const clipsResponse = await fetch('/api/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoUrl: values.videoUrl,
          segments: highlights 
        }),
      });

      const clipsData = await clipsResponse.json();

      if (!clipsData.clips || !Array.isArray(clipsData.clips)) {
        throw new Error('Invalid clips data received');
      }

      setClips(clipsData.clips);
      setProgress('Done!');
      
    } catch (error) {
      console.error('Processing error:', error);
      setProgress('Error processing video');
      setClips([]);
    } finally {
      setIsProcessing(false);
    }
  }
  async function handleUrlChange(url: string) {
    if (!url) {
      setThumbnail(null);
      return;
    }
  
    try {
      const response = await fetch('/api/process-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        console.error('API Error:', error);
        return;
      }
  
      const data = await response.json();
      if (data.thumbnail) {
        setThumbnail(data.thumbnail);
      }
    } catch (error) {
      console.error('Failed to fetch video info:', error);
      setThumbnail(null);
    }
  }

  return (
    <main className="flex items-center justify-center h-screen">
      <Card className="flex flex-col items-center justify-center w-full max-w-md h-3/5 space-y-8">
        <CardTitle className="flex font-bold text-center text-xl items-center justify-center">
          YouTube Shorts Generator
        </CardTitle>
        
        <CardDescription className="text-center">
          {thumbnail ? (
            <Image 
              src={thumbnail} 
              alt="Video thumbnail" 
              width={256}
              height={128}
              className="rounded-xl object-cover" 
            />
          ) : (
            <div className="bg-orange-500 w-64 h-32 rounded-xl"></div>
          )}
          {isProcessing && (
            <div className="mt-4 text-sm text-gray-500">{progress}</div>
          )}
        </CardDescription>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col w-full items-center justify-center space-y-8">
            <CardContent className="flex flex-col w-full items-center justify-center space-y-8">
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem className="w-2/3">
                    <FormLabel>YouTube URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://youtube.com/..." 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleUrlChange(e.target.value);
                        }}
                        disabled={isProcessing}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a YouTube video URL to process
                    </FormDescription>
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={isProcessing}
                className="w-40"
              >
                {isProcessing ? 'Processing...' : 'Generate Clips'}
              </Button>
            </CardContent>
          </form>
        </Form>

        {clips && clips.length > 0 && (
          <div className="w-full px-4">
            <h3 className="text-lg font-semibold mb-2">Generated Clips</h3>
            <div className="grid grid-cols-2 gap-2">
              {clips.map((clip, index) => (
                <div key={index} className="p-2 border rounded">
                  <video 
                    src={clip} 
                    controls 
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
