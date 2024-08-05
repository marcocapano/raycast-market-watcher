import { getPreferenceValues } from "@raycast/api";

interface Preferences {
  tickers: string;
}

export function getTickersFromPreferences(): string[] {
  const preferences = getPreferenceValues<Preferences>();
  return preferences.tickers.split(",").map((ticker) => ticker.trim());
}