import { useEffect, useState } from "react";
import { Icon, MenuBarExtra, open, openExtensionPreferences } from "@raycast/api";
import { Stock, fetchStockPrice } from "./data";
import { getTickersFromPreferences } from "./settings";
import { retry } from "./retry";
import useDebounce from "./useDebounce";
import formatPrice from "./formatting";
import { List, Cache } from "@raycast/api";
import { useMemo } from 'react';

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

const cache = new Cache();

const useStockPrices = () => {
  const cacheKey = "lastStocksFetch";
  const cachedData = JSON.parse(cache.get(cacheKey) ?? '{}');
  const lastUpdated = cachedData.lastUpdated || null;

  const [stocks, setStocks] = useState<Stock[]>(cachedData.stocks || []);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedIsLoading = useDebounce(isLoading, 1000);
  
  useEffect(() => {
    const fetchStockPrices = async () => {
      console.log("Fetching stock prices");
      setIsLoading(true);
      
      const tickers = getTickersFromPreferences();
      const updatedStocks = await Promise.all(
        tickers.map(async (ticker) => {
          const existingStock = stocks.find((stock) => stock.symbol === ticker);
          try {
            // Retry up to 5 times with 1 second delay to avoid rate limiting
            return await retry(() => fetchStockPrice(ticker), 5, 1000);
          } catch (error) {
            console.error(`Failed to fetch stock price for ${ticker}:`, error);
            return existingStock || createDefaultStock(ticker);
          }
        })
      );

      const date = new Date().toISOString();
      cache.set(cacheKey, JSON.stringify({ stocks: updatedStocks, lastUpdated: date }));
      setIsLoading(false);
      setStocks(updatedStocks);
    };

    fetchStockPrices();
    
    // Set up an interval to fetch prices every 5 seconds while looking at widget.
    // This would be too much for an app, but it's fine for a menu bar app since we expect
    // the widget to not always be in focus (visible).
    const intervalId = setInterval(fetchStockPrices, 5 * 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return { stocks, isLoading: debouncedIsLoading, lastUpdated };
};

export default function Command() {
  const { stocks, isLoading, lastUpdated } = useStockPrices();
  
  const formattedLastUpdated = useMemo(() => {
    return lastUpdated
      ? new Date(lastUpdated).toDateString() === new Date().toDateString()
        ? new Date(lastUpdated).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })
        : new Date(lastUpdated).toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true })
      : '';
  }, [lastUpdated]);

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
        
      <MenuBarExtra.Section>
        <MenuBarExtra.Item title={`Last updated: ${formattedLastUpdated}`} />
        {isLoading && <MenuBarExtra.Item title="Refreshing..." />}
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}