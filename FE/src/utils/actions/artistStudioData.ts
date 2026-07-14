export type StudioTab =
  | "tracks"
  | "distribution"
  | "vinyl"
  | "comments"
  | "benefits";

export const studioTabs: {
  label: string;
  value: StudioTab;
}[] = [
  {
    label: "SoundClone Tracks",
    value: "tracks",
  },
  {
    label: "Distribution",
    value: "distribution",
  },
  {
    label: "Vinyl Records",
    value: "vinyl",
  },
  {
    label: "Comments",
    value: "comments",
  },
  {
    label: "Benefits",
    value: "benefits",
  },
];
