// Types shared between the Express server and the React client.

export interface TrendingToken {
  rank: number;
  address: string;
  pairAddress: string | null;
  name: string;
  symbol: string;
  imageUrl: string | null;
  chain: string;
  priceUsd: number;
  change5m: number;
  change1h: number;
  change6h: number;
  change24h: number;
  volume24h: number;
  txns24h: number;
  liquidityUsd: number;
  marketCapUsd: number;
  score: number;
  activeBoosts: number;
  golden: boolean;
  isDemo?: boolean;
}

export interface TrendingResponse {
  tokens: TrendingToken[];
  updatedAt: number;
  live: boolean;
}

export interface BoostPackage {
  id: string;
  boosts: number;
  usd: number;
  label: string;
  tagline: string;
  golden?: boolean;
  popular?: boolean;
}

export interface SiteConfig {
  receiveWallet: string;
  packages: BoostPackage[];
  adPricePerDay: number;
  boostDurationHours: number;
  solPriceUsd: number;
  pumpFunCA: string;
  pumpFunUrl: string;
}

export type OrderType = "boost" | "ad";
export type OrderStatus = "pending" | "paid" | "expired";

export interface PaymentDetails {
  recipient: string;
  amountSol: number;
  amountLamports: number;
  reference: string;
  solanaPayUrl: string;
  expiresAt: number;
}

export interface OrderPublic {
  id: string;
  type: OrderType;
  status: OrderStatus;
  tokenAddress: string;
  tokenSymbol: string | null;
  boosts: number | null;
  adDays: number | null;
  usd: number;
  payment: PaymentDetails;
  signature: string | null;
  createdAt: number;
}

export interface ActiveAd {
  id: number;
  name: string;
  imageUrl: string;
  linkUrl: string;
  expiresAt: number;
}

export interface TokenLookup {
  found: boolean;
  address: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
  change24h: number | null;
  pairAddress: string | null;
  chain: string;
  activeBoosts: number;
}

export interface SiteStats {
  boostsSold: number;
  tokensBoosted: number;
  adsRun: number;
}
