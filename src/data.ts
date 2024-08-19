import yahooFinance from "yahoo-finance2"; // Import yahoo-finance2

export type Stock = {
    symbol: string,
    currency: string | null,
    regularMarketPrice: number | null,
    preMarketPrice: number | null,
    postMarketPrice: number | null,
    regularMarketChange: number | null,
    preMarketChange: number | null,
    postMarketChange: number | null,
    regularMarketChangePercent: number | null,
    preMarketChangePercent: number | null,
    postMarketChangePercent: number | null,
    name: string,
    marketState: string | null
};

export async function fetchStockPrice(symbol: string): Promise<Stock | null> {
    try {
        const quote = await yahooFinance.quoteSummary(symbol);
        return {
            symbol: symbol,
            regularMarketPrice: quote.price?.regularMarketPrice || null,
            preMarketPrice: quote.price?.preMarketPrice || null,
            postMarketPrice: quote.price?.postMarketPrice || null,
            currency: quote.price?.currencySymbol || null,
            regularMarketChange: quote.price?.regularMarketChange || null,
            preMarketChange: quote.price?.preMarketChange || null,
            postMarketChange: quote.price?.postMarketChange || null,
            regularMarketChangePercent: quote.price?.regularMarketChangePercent || null,
            preMarketChangePercent: quote.price?.preMarketChangePercent || null,
            postMarketChangePercent: quote.price?.postMarketChangePercent || null,
            name: quote.price?.shortName || symbol,
            marketState: quote.price?.marketState || null
        };
    } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return null;
    }
}