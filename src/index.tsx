import { useEffect, useState } from "react";
import { Icon, MenuBarExtra, open } from "@raycast/api";
import yahooFinance from "yahoo-finance2"; // Import yahoo-finance2

type Stock = {
  symbol: string,
  currency: string | null,
  price: number | null,
  priceChange: number | null,
  priceChangePercent: number | null,
  name: string
};

const useStockPrices = () => {
  const [state, setState] = useState<{ stocks: Stock[]; isLoading: boolean }>({
    stocks: [
      { symbol: "SPOT", currency: null, price: null, priceChange: null, priceChangePercent: null, name: "Spotify" },
      { symbol: "VWRL.L", currency: null, price: null, priceChange: null, priceChangePercent: null, name: "Vanguard FTSE All-World" }, // VWRL on London stock exchange
      { symbol: "VUSA.L", currency: null, price: null, priceChange: null, priceChangePercent: null, name: "Vanguard S&P 500" } // VUSA on London stock exchange
    ],
    isLoading: true,
  });

  useEffect(() => {
    const fetchStockPrice = async (symbol: string) => {
      try {
        const quote = await yahooFinance.quoteSummary(symbol);
        return { 
          currentPrice: quote.price?.marketState === "PRE" ? quote.price?.preMarketPrice || null : quote.price?.regularMarketPrice || null,
          currency: quote.price?.currencySymbol || null,
          priceChange: quote.price?.marketState === "PRE" ? quote.price?.preMarketChange || null : quote.price?.regularMarketChange || null,
          priceChangePercent: quote.price?.marketState === "PRE" ? quote.price?.preMarketChangePercent || null : quote.price?.regularMarketChangePercent || null
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return null;
      }
    };

    const fetchStockPrices = async () => {
      const updatedStocks = await Promise.all(
      state.stocks.map(async (stock) => {
        const stockInfo = await fetchStockPrice(stock.symbol);

        if (stockInfo) {
          const { currentPrice = null, currency = null, priceChange = null, priceChangePercent = null } = stockInfo;
          return { ...stock, price: currentPrice, currency: currency, priceChange: priceChange, priceChangePercent: priceChangePercent };
        } else {
          // if no value, keep last known value
          return stock;
        }
      })
      );
      setState({ stocks: updatedStocks, isLoading: false });
    };

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
      <MenuBarExtra.Item title="Stock Prices" />
      {stocks.map((stock) => (
        <MenuBarExtra.Item
          key={stock.symbol}
          title={`${stock.name}: ${stock.currency}${stock.price?.toFixed(2) || "N/A"} (${formatPercentage(stock.priceChangePercent)}, ${stock.priceChange?.toFixed(2) || ""})`}
          onAction={() => openAction(stock)}
        />
      ))}
    </MenuBarExtra>
  );
}