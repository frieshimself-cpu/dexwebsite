import type {
  TrendingResponse,
  SiteConfig,
  OrderPublic,
  ActiveAd,
  TokenLookup,
  SiteStats,
} from "@shared/types";

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `Request failed (${r.status})`);
  return r.json() as Promise<T>;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error ?? `Request failed (${r.status})`);
  return j as T;
}

export const api = {
  config: () => get<SiteConfig>("/api/config"),
  trending: () => get<TrendingResponse>("/api/trending"),
  token: (address: string) => get<TokenLookup>(`/api/token/${address}`),
  ads: () => get<{ ads: ActiveAd[] }>("/api/ads/active"),
  stats: () => get<SiteStats>("/api/stats"),
  createOrder: (body: {
    type: "boost" | "ad";
    tokenAddress: string;
    packageId?: string;
    adDays?: number;
    adImageUrl?: string;
    adLinkUrl?: string;
  }) => post<{ order: OrderPublic }>("/api/orders", body),
  order: (id: string) => get<{ order: OrderPublic }>(`/api/orders/${id}`),
  verifyOrder: (id: string, signature: string) =>
    post<{ order: OrderPublic }>(`/api/orders/${id}/verify`, { signature }),
};

export const isSolanaAddress = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s.trim());
