import { useEffect, useState } from "react";
import { Icon, MenuBarExtra, open, openExtensionPreferences } from "@raycast/api";
import { Stock, fetchStockPrice } from "./data";
import { getTickersFromPreferences } from "./settings";

const useStockPrices = () => {
  const [state, setState] = useState<{ stocks: Stock[]; isLoading: boolean }>({
    stocks: [],
    isLoading: true,
  });

  useEffect(() => {
    const fetchStockPrices = async () => {
      const tickers = getTickersFromPreferences();
      const updatedStocks = await Promise.all(
        tickers.map(async (ticker) => {
          const stockInfo = await fetchStockPrice(ticker);
      
          if (stockInfo) {
            const { price = null, currency = null, priceChange = null, priceChangePercent = null } = stockInfo;
            return { symbol: ticker, name: ticker, price: price, currency: currency, priceChange: priceChange, priceChangePercent: priceChangePercent };
          } else {
            // if no value, keep last known value
            return state.stocks.find((stock) => stock.symbol === ticker)
             || { symbol: ticker, name: ticker, price: null, currency: null, priceChange: null, priceChangePercent: null };
          }
        })
      );
      setState({ stocks: updatedStocks, isLoading: false });
    };

    console.log(getTickersFromPreferences());
    fetchStockPrices();
  }, []);

  return state;
};

export default function Command() {
  const { stocks, isLoading } = useStockPrices();
  const formatPercentage = (percentage: number | null) => {
    if (percentage === null) {
      return "";
    }
    return (percentage * 100).toFixed(2).concat("%");
  }

  const openAction = (stock: Stock) => {
    open(`https://finance.yahoo.com/quote/${stock.symbol}`);
  }

  return (
    <MenuBarExtra icon={Icon.BankNote} isLoading={isLoading}>
      <MenuBarExtra.Section title="Tickers">
        {stocks.map((stock) => (
          <MenuBarExtra.Item
            key={stock.symbol}
            title={`${stock.name}: ${stock.currency}${stock.price?.toFixed(2) || "N/A"} (${formatPercentage(stock.priceChangePercent)}, ${stock.priceChange?.toFixed(2) || ""})`}
            onAction={() => openAction(stock)}
          />
        ))}
      </MenuBarExtra.Section>
      <MenuBarExtra.Section>
        <MenuBarExtra.Item title="Change tracked tickers" onAction={() => openExtensionPreferences()} />
      </MenuBarExtra.Section>      
    </MenuBarExtra>
  );
}