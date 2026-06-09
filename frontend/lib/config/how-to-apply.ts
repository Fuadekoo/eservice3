import {
  UserPlus,
  Search,
  FileText,
  Send,
  Bell,
  type LucideIcon,
} from "lucide-react";

export type HowToApplyStep = {
  step: number;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
};

export const HOW_TO_APPLY_STEPS: HowToApplyStep[] = [
  {
    step: 1,
    titleKey: "Create Your Account",
    descriptionKey:
      "Sign up with your phone number and personal details to access government services online.",
    icon: UserPlus,
  },
  {
    step: 2,
    titleKey: "Find a Service",
    descriptionKey:
      "Browse government offices on the homepage or search for the service you need.",
    icon: Search,
  },
  {
    step: 3,
    titleKey: "Review Requirements",
    descriptionKey:
      "Open the service details to read the description, processing time, and required documents.",
    icon: FileText,
  },
  {
    step: 4,
    titleKey: "Submit Your Application",
    descriptionKey:
      "Click Apply Now, complete the application form, and upload any required documents.",
    icon: Send,
  },
  {
    step: 5,
    titleKey: "Track Your Request",
    descriptionKey:
      "Log in to your dashboard to follow your request status and receive updates.",
    icon: Bell,
  },
];

export const TUTORIAL_VIDEO_URL =
  process.env.NEXT_PUBLIC_TUTORIAL_VIDEO_URL?.trim() || "";

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const watchId = parsed.searchParams.get("v");
      if (watchId) return `https://www.youtube.com/embed/${watchId}`;

      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch?.[1]) return `https://www.youtube.com/embed/${embedMatch[1]}`;

      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
      if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }
  } catch {
    return null;
  }

  return null;
}
