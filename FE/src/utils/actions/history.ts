const LISTENING_HISTORY_KEY = "soundclone-listening-history";

export const getTrackId = (track?: any) => {
  return track?._id || track?.id || "";
};

export const getTrackImageUrl = (imgUrl?: string | null) => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  if (!imgUrl) return "/audio/SC.png";
  if (imgUrl.startsWith("http")) return imgUrl;
  if (imgUrl.startsWith("/uploads/images")) return `${BACKEND_URL}${imgUrl}`;
  if (imgUrl.startsWith("/")) return imgUrl;

  return `${BACKEND_URL}/uploads/images/${imgUrl}`;
};

export const getListeningHistory = (): ITrackTop[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LISTENING_HISTORY_KEY);

    if (!raw) return [];

    const tracks = JSON.parse(raw);

    return Array.isArray(tracks) ? tracks : [];
  } catch {
    return [];
  }
};

export const saveListeningHistory = (track?: Partial<ITrackTop> | null) => {
  if (typeof window === "undefined") return;

  const trackId = getTrackId(track);

  if (!trackId || !track?.title) return;

  const oldTracks = getListeningHistory();

  const newTrack = {
    _id: trackId,
    id: trackId,
    title: track.title,
    slug: (track as any).slug,
    description: track.description,
    category: track.category,
    imgUrl: track.imgUrl,
    trackUrl: track.trackUrl,
    countPlay: track.countPlay ?? 0,
    countLike: track.countLike ?? 0,
    uploaderId: (track as any).uploaderId,
    uploader: (track as any).uploader,
    listenedAt: new Date().toISOString(),
  };

  const nextTracks = [
    newTrack,
    ...oldTracks.filter((item) => getTrackId(item) !== trackId),
  ].slice(0, 20);

  localStorage.setItem(LISTENING_HISTORY_KEY, JSON.stringify(nextTracks));
};

export const clearListeningHistory = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(LISTENING_HISTORY_KEY);
};
