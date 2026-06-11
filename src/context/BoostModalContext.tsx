import { createContext, useContext, useState, type ReactNode } from "react";

interface BoostModalState {
  open: boolean;
  mode: "boost" | "ad";
  prefillToken?: string;
  prefillPackageId?: string;
}

interface BoostModalApi extends BoostModalState {
  openBoost: (opts?: { token?: string; packageId?: string }) => void;
  openAd: () => void;
  close: () => void;
}

const Ctx = createContext<BoostModalApi | null>(null);

export function BoostModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BoostModalState>({ open: false, mode: "boost" });

  const api: BoostModalApi = {
    ...state,
    openBoost: (opts) =>
      setState({ open: true, mode: "boost", prefillToken: opts?.token, prefillPackageId: opts?.packageId }),
    openAd: () => setState({ open: true, mode: "ad" }),
    close: () => setState((s) => ({ ...s, open: false })),
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useBoostModal(): BoostModalApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBoostModal outside provider");
  return v;
}
