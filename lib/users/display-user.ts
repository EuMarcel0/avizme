export type AppUser = {
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
};

export function getDisplayName(user: AppUser) {
  return user.fullName?.trim() || user.email.split("@")[0] || "Usuário";
}

export function getUserInitials(user: AppUser) {
  const name = getDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
