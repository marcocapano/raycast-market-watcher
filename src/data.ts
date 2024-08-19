import yahooFinance from "yahoo-finance2"; // Import yahoo-finance2

export type Stock = {
    symbol: string,
    currency: string | null,
    price: number | null,
    priceChange: number | null,
    priceChangePercent: number | null,
    name: string
};

export async function fetchStockPrice(symbol: string): Promise<Stock | null> {
    try {
        const quote = await yahooFinance.quoteSummary(symbol);
        return {
            symbol: symbol,
            price: quote.price?.marketState === "PRE" ? quote.price?.preMarketPrice || null : quote.price?.regularMarketPrice || null,
            currency: quote.price?.currencySymbol || null,
            priceChange: quote.price?.marketState === "PRE" ? quote.price?.preMarketChange || null : quote.price?.regularMarketChange || null,
            priceChangePercent: quote.price?.marketState === "PRE" ? quote.price?.preMarketChangePercent || null : quote.price?.regularMarketChangePercent || null,
            name: quote.price?.shortName || symbol
        };
    } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return null;
    }
}