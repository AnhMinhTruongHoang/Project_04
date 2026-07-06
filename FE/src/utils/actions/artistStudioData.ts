export type StudioTab =
  | "tracks"
  | "distribution"
  | "vinyl"
  | "comments"
  | "benefits";

export type StudioTrack = {
  id: string;
  title: string;
  fileName: string;
  status: "active" | "removed" | "draft";
  notice?: string;
  duration: string;
  date: string;
  engagements: number;
  plays: number;
  coverGradient: string;
};

export type StudioBenefit = {
  id: string;
  title: string;
  description: string;
  saveLabel: string;
  gradient: string;
};

export const studioTabs: { label: string; value: StudioTab }[] = [
  { label: "SoundClone Tracks", value: "tracks" },
  { label: "Distribution", value: "distribution" },
  { label: "Vinyl Records", value: "vinyl" },
  { label: "Comments", value: "comments" },
  { label: "Benefits", value: "benefits" },
];

export const studioStats = [
  {
    key: "plays",
    value: "0",
    label: "SC plays",
  },
  {
    key: "reposts",
    value: "0",
    label: "Reposts",
  },
  {
    key: "downloads",
    value: "0",
    label: "Downloads",
  },
  {
    key: "likes",
    value: "0",
    label: "Likes",
  },
  {
    key: "comments",
    value: "0",
    label: "Comments",
  },
  {
    key: "insights",
    value: "",
    label: "Insights",
  },
  {
    key: "earnings",
    value: "",
    label: "Earnings",
  },
  {
    key: "fans",
    value: "",
    label: "Fans",
  },
  {
    key: "benefits",
    value: "",
    label: "Benefits",
  },
];

export const studioTracks: StudioTrack[] = [
  {
    id: "1",
    title: "Dante Klein & Jantine - what i like about u",
    fileName: "Official Music Video.mp3",
    status: "removed",
    notice: "This track has been removed for copyright reasons.",
    duration: "03:24",
    date: "2026-07-05",
    engagements: 0,
    plays: 0,
    coverGradient: "linear-gradient(135deg, #3b1f12, #e26d2f)",
  },
];

export const studioBenefits: StudioBenefit[] = [
  {
    id: "1",
    title: "Get 2 free months of Splice Sounds+ royalty-free samples",
    description: "Access loops, presets, one-shots, and production sounds.",
    saveLabel: "Save $25.98",
    gradient:
      "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(80,80,80,0.28)), radial-gradient(circle at 20% 30%, #ffffff, transparent 28%)",
  },
  {
    id: "2",
    title: "Get 20% off all campaigns on Groover.co",
    description: "Promote your music and reach new curators faster.",
    saveLabel: "Save $21",
    gradient:
      "linear-gradient(135deg, #111111, #3b3b3b), radial-gradient(circle at 75% 35%, #ffffff, transparent 24%)",
  },
  {
    id: "3",
    title: "Get 1 month free of Native Instruments 360 Pro suite",
    description: "Unlock pro audio tools for production and mastering.",
    saveLabel: "Save $50",
    gradient:
      "linear-gradient(135deg, #0f172a, #334155), radial-gradient(circle at 70% 30%, #dbeafe, transparent 30%)",
  },
  {
    id: "4",
    title: "Get 3 free months of Output's Arcade plug-in and samples",
    description: "Experiment with creative instruments and sample libraries.",
    saveLabel: "Save $39",
    gradient:
      "linear-gradient(135deg, #30125f, #ff8a00), radial-gradient(circle at 70% 30%, #00ffe0, transparent 24%)",
  },
];
