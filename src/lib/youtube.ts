export type VideoProvider = "youtube" | "vimeo" | "facebook";

const PATTERNS: Array<{ provider: VideoProvider; re: RegExp }> = [
  { provider: "youtube", re: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/ },
  { provider: "vimeo", re: /vimeo\.com\/(?:video\/)?(\d+)/ },
  { provider: "facebook", re: /facebook\.com\/(?:[\w.]+\/videos\/|watch\/?\?v=)(\d+)/ },
];

export function parseVideoUrl(url: string): { provider: VideoProvider; videoId: string } | null {
  for (const { provider, re } of PATTERNS) {
    const m = url.match(re);
    if (m) return { provider, videoId: m[1] };
  }
  return null;
}

export function embedUrl(provider: VideoProvider, videoId: string): string {
  switch (provider) {
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    case "vimeo":
      return `https://player.vimeo.com/video/${videoId}`;
    case "facebook":
      return `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/watch/?v=${videoId}`;
  }
}

export function thumbnailUrl(provider: VideoProvider, videoId: string): string | null {
  if (provider === "youtube") {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  return null;
}
