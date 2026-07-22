const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

/**
 * Normalize legacy localhost media URLs.
 *
 * Examples:
 * http://localhost:8000/uploads/images/a.jpg
 * -> https://your-backend.com/uploads/images/a.jpg
 */
const normalizeLegacyBackendUrl = (url: string) => {
  if (
    url.startsWith("http://localhost:8000") ||
    url.startsWith("http://127.0.0.1:8000") ||
    url.startsWith("http://localhost:8080") ||
    url.startsWith("http://127.0.0.1:8080")
  ) {
    const path = url.replace(
      /^http:\/\/(localhost|127\.0\.0\.1):(8000|8080)/,
      ""
    );

    return `${BACKEND_URL}${path}`;
  }

  return url;
};

/**
 * Build full image URL.
 */
export const getImageUrl = (
  path?: string | null,
  fallback = "/images/logo/Sc.png"
) => {
  if (!path) {
    return fallback;
  }

  const normalizedPath = path.trim();

  if (!normalizedPath) {
    return fallback;
  }

  // Legacy localhost URL
  if (
    normalizedPath.startsWith("http://localhost:") ||
    normalizedPath.startsWith("http://127.0.0.1:")
  ) {
    return normalizeLegacyBackendUrl(normalizedPath);
  }

  // Cloudinary / external URL
  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://")
  ) {
    return normalizedPath;
  }

  // Legacy backend upload path
  if (normalizedPath.startsWith("/uploads")) {
    return `${BACKEND_URL}${normalizedPath}`;
  }

  // Frontend public asset
  if (normalizedPath.startsWith("/")) {
    return normalizedPath;
  }

  // Legacy image filename only
  return `${BACKEND_URL}/uploads/images/${normalizedPath}`;
};

/**
 * User avatar
 */
export const getUserAvatarUrl = (user?: Partial<IUser> | null) => {
  return getImageUrl(
    user?.avatarUrl ||
      (user as any)?.avatar ||
      (user as any)?.image ||
      (user as any)?.picture,
    ""
  );
};

/**
 * User cover
 */
export const getUserCoverUrl = (user?: any) => {
  const cover = user?.coverUrl || "";

  if (!cover) {
    return "/images/default-cover.jpg";
  }

  return getImageUrl(cover, "/images/default-cover.jpg");
};

/**
 * Track image
 */
export const getTrackImageUrl = (track?: ITrackTop | string | null) => {
  if (typeof track === "string") {
    return getImageUrl(track);
  }

  return getImageUrl(track?.imgUrl || track?.image || track?.thumbnail);
};

/**
 * Playlist cover
 */
export const getPlaylistCoverUrl = (playlist?: Partial<IPlaylist> | null) => {
  return getImageUrl(
    (playlist as any)?.coverUrl || (playlist as any)?.image,
    "/images/default-playlist.jpg"
  );
};

/**
 * Category image
 */
export const getCategoryImageUrl = (category?: Partial<ICategory> | null) => {
  return getImageUrl((category as any)?.image, "/images/logo/Sc.png");
};

/**
 * Avatar initials
 */
export const getInitials = (name?: string, email?: string) => {
  const value = name?.trim() || email?.trim() || "User";

  const words = value.split(" ").filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  if (words.length === 1) {
    return words[0][0].toUpperCase();
  }

  return "U";
};

/**
 * Subscription
 */
export const isArtist = (user?: Partial<IUser> | null) => {
  return (
    user?.subscriptionTier === "ARTIST" ||
    user?.subscriptionTier === "ARTIST_PRO"
  );
};

export const isArtistPro = (user?: Partial<IUser> | null) => {
  return user?.subscriptionTier === "ARTIST_PRO";
};

/**
 * Benefit image
 */
export const getBenefitImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) {
    return "";
  }

  return getImageUrl(imageUrl, "");
};
