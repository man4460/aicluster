export type VaultEntry = {
  id: number;
  serviceName: string;
  username: string;
  websiteUrl: string | null;
  category: string | null;
  brandKey: string | null;
  note: string | null;
  isFavorite: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
