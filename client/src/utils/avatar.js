const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const DEFAULT_AVATAR_URL = "https://cdn-icons-png.flaticon.com/512/3607/3607444.png";

export function getAvatarUrl(avatar) {
  if (!avatar) {
    return DEFAULT_AVATAR_URL;
  }

  if (avatar.startsWith("/")) {
    return `${API_BASE_URL}${avatar}`;
  }

  return avatar;
}
