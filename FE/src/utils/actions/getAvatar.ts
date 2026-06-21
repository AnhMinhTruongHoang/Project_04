export const getUserAvatarUrl = (user?: any) => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  const avatar = user?.avatarUrl || "";

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
  const text = name || email || "U";

  return text
    .trim()
    .split(" ")
    .map((item) => item.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};
