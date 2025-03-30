import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface YouTubeEmbedProps {
  videoId: string;
}

export default function YouTubeEmbed({ videoId }: YouTubeEmbedProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`https://youtube.com/watch?v=${videoId}`);
      toast({
        title: "Link copied",
        description: "YouTube link has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-black/50 rounded-lg overflow-hidden">
      <div className="flex items-center space-x-2 p-4">
        <div className="flex-1">
          <input
            type="text"
            value={`https://youtube.com/watch?v=${videoId}`}
            readOnly
            className="w-full bg-black/20 text-white px-3 py-2 rounded border border-white/10"
          />
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleCopy}
          className="shrink-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}