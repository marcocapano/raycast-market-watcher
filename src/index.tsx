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

    console.log(getTickersFromPreferences());
    fetchStockPrices();
  }, []);

  return state;
};

export default function Command() {
  const { stocks, isLoading } = useStockPrices();
  
  const formatPercentage = (percentage: number | null) => {
    if (percentage === null || percentage === undefined) return "";
    return (percentage * 100).toFixed(2).concat("%");
  }

  const formatPrice = (priceData: { price: number | null, priceChange: number | null, priceChangePercent: number | null } | null) => {
    if (!priceData || priceData.price === null || priceData.price === undefined) return "N/A";
    const changePercent = priceData.priceChangePercent !== null && priceData.priceChangePercent !== undefined
      ? formatPercentage(priceData.priceChangePercent)
      : "";
    const change = priceData.priceChange !== null && priceData.priceChange !== undefined
      ? priceData.priceChange.toFixed(2)
      : "";
    return `${priceData.price.toFixed(2)} (${changePercent}, ${change})`;
  }

  const openAction = (stock: Stock) => {
    open(`https://finance.yahoo.com/quote/${stock.symbol}`);
  }

  const preMarketStocks = stocks.filter(stock => stock.marketState === 'PRE');
  const marketStocks = stocks.filter(stock => stock.marketState === 'REGULAR');
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
      {marketStocks.length > 0 && (
        <MenuBarExtra.Section title="Market">
          {marketStocks.map((stock) => (
            <MenuBarExtra.Item
              key={stock.symbol}
              title={`${stock.symbol}: ${stock.currency || ""}${formatPrice({
                price: stock.regularMarketPrice,
                priceChange: stock.regularMarketChange,
                priceChangePercent: stock.regularMarketChangePercent
              })}`}
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