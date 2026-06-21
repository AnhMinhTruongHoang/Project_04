export const getUserAvatarUrl = (user?: any) => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const avatar =
    user?.avatarUrl || user?.avatar || user?.image || user?.picture || "";

  if (!avatar) return "";

  if (avatar.startsWith("http")) {
    return avatar;
  }

  if (avatar.startsWith("/uploads/images")) {
    return `${BACKEND_URL}${avatar}`;
  }

  if (avatar.startsWith("/")) {
    return avatar;
  }

  return `${BACKEND_URL}/uploads/images/${avatar}`;
};

export const getInitials = (name?: string, email?: string) => {
  const value = name?.trim() || email?.trim() || "User";
  const words = value.split(" ").filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
};

export const getTrackImageUrl = (imgUrl?: string | null) => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  if (!imgUrl) return "/images/logo/Sc.png";

  if (imgUrl.startsWith("http")) {
    return imgUrl;
  }

  if (imgUrl.startsWith("/uploads/images")) {
    return `${BACKEND_URL}${imgUrl}`;
  }

  if (imgUrl.startsWith("/")) {
    return imgUrl;
  }

  return `${BACKEND_URL}/uploads/images/${imgUrl}`;
};
