import { createContext, useContext } from "react";

export const PRIVACY_LAST_UPDATED = "November 2026";

export type PrivacyPolicyContextValue = {
  openPrivacyPolicy: () => void;
};

export const PrivacyPolicyContext = createContext<PrivacyPolicyContextValue | null>(null);

export function usePrivacyPolicy() {
  const context = useContext(PrivacyPolicyContext);
  if (!context) {
    throw new Error("usePrivacyPolicy must be used within a PrivacyPolicyProvider");
  }
  return context;
}
