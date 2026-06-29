import { convertSlugUrl } from "@/utils/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export const getSafeUserId = (user?: any) => {
  return (
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.user_id ||
    user?.uploaderId ||
    user?.createdById ||
    user?.profileId ||
    ""
  );
};

export const getSafeTrackId = (track?: any) => {
  const id =
    track?.track?.id ||
    track?.track?.trackId ||
    track?.id ||
    track?.trackId ||
    track?.track_id ||
    track?._id ||
    track?.track?._id ||
    "";

  const cleanId = String(id || "").trim();

  if (!cleanId) return "";

  // Trường hợp playlist trả về _id dài kiểu relation id nhưng track detail cần id ngắn 6 ký tự.
  // Nếu object có id/trackId thật thì đã lấy ở trên trước _id rồi.
  // Chỉ fallback cắt khi id quá dài và không có field id khác.
  if (
    !track?.id &&
    !track?.trackId &&
    !track?.track_id &&
    !track?.track?.id &&
    cleanId.length > 6
  ) {
    return cleanId.slice(0, 6);
  }

  return cleanId;
};

export const getAudioUrl = (trackUrl?: string | null) => {
  if (!trackUrl) return "";

  const cleanUrl = String(trackUrl).trim();

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith("/uploads/audio")) {
    return `${BACKEND_URL}${cleanUrl}`;
  }

  if (cleanUrl.startsWith("/")) {
    return `${BACKEND_URL}${cleanUrl}`;
  }

  return `${BACKEND_URL}/uploads/audio/${cleanUrl}`;
};

export const getTrackHref = (track?: any, autoplay = false) => {
  const trackId =
    track?.id ||
    track?.trackId ||
    track?.track_id ||
    track?.track?.id ||
    track?.track?.trackId ||
    track?._id ||
    track?.track?._id ||
    "";

  const cleanTrackId = String(trackId || "").trim();

  if (!cleanTrackId) return "#";

  const title = track?.title || track?.track?.title || "track";

  const audio =
    track?.trackUrl ||
    track?.audioUrl ||
    track?.url ||
    track?.track?.trackUrl ||
    track?.track?.audioUrl ||
    "";

  const savedSlug =
    track?.slug ||
    track?.trackSlug ||
    track?.permalink ||
    track?.track?.slug ||
    track?.track?.trackSlug ||
    "";

  const cleanSavedSlug = String(savedSlug || "")
    .replace("/track/", "")
    .replace(".html", "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  const shortId =
    cleanTrackId.length > 6 ? cleanTrackId.slice(0, 6) : cleanTrackId;

  const slug = cleanSavedSlug
    ? cleanSavedSlug
    : `${convertSlugUrl(title)}-${shortId}`;

  const audioUrl = getAudioUrl(audio);

  let href = `/track/${slug}.html?audio=${encodeURIComponent(audioUrl)}`;

  if (autoplay) {
    href += "&autoplay=1";
  }

  return href;
};
export const getUserHref = (user?: any) => {
  const userId = getSafeUserId(user);

  if (!userId) return "#";

  return `/profile/${userId}`;
};
