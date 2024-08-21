import { useEffect, useState } from "react";
import { Icon, MenuBarExtra, open, openExtensionPreferences } from "@raycast/api";
import { Stock, fetchStockPrice } from "./data";
import { getTickersFromPreferences } from "./settings";

function createDefaultStock(ticker: string): Stock {
  return {
    symbol: ticker,
    name: ticker,
    preMarketPrice: null,
    preMarketChange: null,
    preMarketChangePercent: null,
    regularMarketPrice: null,
    regularMarketChange: null,
    regularMarketChangePercent: null,
    postMarketPrice: null,
    postMarketChange: null,
    postMarketChangePercent: null,
    marketState: null,
    currency: null
  };
}

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
          return stockInfo || state.stocks.find((stock) => stock.symbol === ticker) || createDefaultStock(ticker);
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
    if (percentage === null || percentage === undefined) return "";
    const sign = percentage >= 0 ? "+" : "-";
    return `${sign}${(Math.abs(percentage) * 100).toFixed(2)}%`;
  }

  const formatPrice = (priceData: { price: number | null, priceChange: number | null, priceChangePercent: number | null } | null) => {
    if (!priceData || priceData.price === null) return "N/A";

    const priceChangeSign = priceData.priceChange >= 0 ? "+" : "-";
    const priceChange = priceData.priceChange !== null ? `${priceChangeSign}${Math.abs(priceData.priceChange).toFixed(2)}` : "";

    if (priceData.priceChangePercent === null && priceData.priceChange !== null) {
      return `${priceData.price.toFixed(2)} (${priceChange})`;
    }

    if (priceData.priceChangePercent !== null && priceData.priceChange === null) {
      return `${priceData.price.toFixed(2)} (${formatPercentage(priceData.priceChangePercent)})`;
    }

    if (priceData.priceChangePercent !== null && priceData.priceChange !== null) {
      return `${priceData.price.toFixed(2)} (${formatPercentage(priceData.priceChangePercent)}, ${priceChange})`;
    } else {
      return priceData.price.toFixed(2);
    }

    return "N/A";
  }

  const openAction = (stock: Stock) => {
    open(`https://finance.yahoo.com/quote/${stock.symbol}`);
  }

  const preMarketStocks = stocks.filter(stock => stock.marketState === 'PRE');
  const postMarketStocks = stocks.filter(stock => stock.marketState === 'POST');

  return (
    <MenuBarExtra icon={Icon.BankNote} isLoading={isLoading}>
      {preMarketStocks.length > 0 && (
        <MenuBarExtra.Section title="Pre-Market">
          {preMarketStocks.map((stock) => (
            <MenuBarExtra.Item
              key={stock.symbol}
              title={`${stock.symbol}: ${stock.currency || ""}${formatPrice({
                price: stock.preMarketPrice,
                priceChange: stock.preMarketChange,
                priceChangePercent: stock.preMarketChangePercent
              })}`}
              onAction={() => openAction(stock)}
            />
          ))}
        </MenuBarExtra.Section>
      )}
      {stocks.length > 0 && (
        <MenuBarExtra.Section title="Market">
          {stocks.map((stock) => (
            <MenuBarExtra.Item
              key={stock.symbol}
              title={`${stock.symbol}: ${stock.currency || ""}${formatPrice({
                price: stock.regularMarketPrice,
                priceChange: stock.regularMarketChange,
                priceChangePercent: stock.regularMarketChangePercent
              })}${stock.marketState === 'REGULAR' ? "" : " (Price at close)"}`}
              onAction={() => openAction(stock)}
            />
          ))}
        </MenuBarExtra.Section>
      )}
      {postMarketStocks.length > 0 && (
        <MenuBarExtra.Section title="Post-Market">
          {postMarketStocks.map((stock) => (
            <MenuBarExtra.Item
              key={stock.symbol}
              title={`${stock.symbol}: ${stock.currency || ""}${formatPrice({
                price: stock.postMarketPrice,
                priceChange: stock.postMarketChange,
                priceChangePercent: stock.postMarketChangePercent
              })}`}
              onAction={() => openAction(stock)}
            />  
          ))}
        </MenuBarExtra.Section>
      )}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item title="Change tracked tickers" onAction={() => openExtensionPreferences()} />
      </MenuBarExtra.Section>      
    </MenuBarExtra>
  );
}