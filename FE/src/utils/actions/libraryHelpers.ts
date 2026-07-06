import { getTrackId } from "@/utils/api";

export const getTrackTitle = (track?: any) => {
  return track?.title || track?.name || "Untitled track";
};

export const getTrackArtist = (track?: any) => {
  return (
    track?.artistName ||
    track?.artist ||
    track?.author ||
    track?.description ||
    track?.uploader?.name ||
    track?.uploader?.email ||
    "Unknown artist"
  );
};

export const getTrackImage = (track?: any) => {
  const image =
    track?.imgUrl ||
    track?.image ||
    track?.thumbnail ||
    track?.cover ||
    track?.coverUrl ||
    "";

  if (!image) return "/audio/SC.png";

  if (image.startsWith("http")) return image;
  if (image.startsWith("/")) return image;

  return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/images/${image}`;
};

export const getPlaylistTitle = (playlist?: any) => {
  return playlist?.title || playlist?.name || "Untitled playlist";
};

export const getPlaylistTracks = (playlist?: any) => {
  if (Array.isArray(playlist?.tracks)) return playlist.tracks;
  if (Array.isArray(playlist?.trackList)) return playlist.trackList;
  return [];
};

export const getPlaylistCover = (playlist?: any) => {
  const tracks = getPlaylistTracks(playlist);
  const firstTrack = tracks[0];

  return getTrackImage(firstTrack);
};

export const getSafeTrackId = (track?: any) => {
  return getTrackId(track) || track?._id || track?.id || "";
};
