// export const getUserAvatarUrl = (user?: any) => {
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

//   const avatar =
//     user?.avatarUrl || user?.avatar || user?.image || user?.picture || "";

//   if (!avatar) return "";

//   if (avatar.startsWith("http")) {
//     return avatar;
//   }

//   if (avatar.startsWith("/uploads/images")) {
//     return `${BACKEND_URL}${avatar}`;
//   }

//   if (avatar.startsWith("/")) {
//     return avatar;
//   }

//   return `${BACKEND_URL}/uploads/images/${avatar}`;
// };

// export const getInitials = (name?: string, email?: string) => {
//   const value = name?.trim() || email?.trim() || "User";
//   const words = value.split(" ").filter(Boolean);

//   if (words.length >= 2) {
//     return `${words[0][0]}${words[1][0]}`.toUpperCase();
//   }

//   return value.slice(0, 2).toUpperCase();
// };

// export const getTrackImageUrl = (imgUrl?: string | null) => {
//   const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

//   if (!imgUrl) return "/images/logo/Sc.png";

//   if (imgUrl.startsWith("http")) {
//     return imgUrl;
//   }

//   if (imgUrl.startsWith("/uploads/images")) {
//     return `${BACKEND_URL}${imgUrl}`;
//   }

//   if (imgUrl.startsWith("/")) {
//     return imgUrl;
//   }

//   return `${BACKEND_URL}/uploads/images/${imgUrl}`;
// };

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

/**
 * Build full image url.
 */
export const getImageUrl = (
  path?: string | null,
  fallback = "/images/logo/Sc.png"
) => {
  if (!path) return fallback;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/uploads")) {
    return `${BACKEND_URL}${path}`;
  }

  if (path.startsWith("/")) {
    return path;
  }

  return `${BACKEND_URL}/uploads/images/${path}`;
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
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const cover = user?.coverUrl || "";

  if (!cover) return "/images/default-cover.jpg";

  if (cover.startsWith("http")) return cover;

  if (cover.startsWith("/uploads/images")) {
    return `${BACKEND_URL}${cover}`;
  }

  return `${BACKEND_URL}/uploads/images/${cover}`;
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
