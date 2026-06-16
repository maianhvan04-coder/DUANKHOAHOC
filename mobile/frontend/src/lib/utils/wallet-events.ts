export const WALLET_BALANCE_CHANGED_EVENT = "wallet-balance-change";

export function emitWalletBalanceChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WALLET_BALANCE_CHANGED_EVENT));
}
