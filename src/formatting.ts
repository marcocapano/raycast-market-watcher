export default function formatPrice(priceData: { price: number | null, priceChange: number | null, priceChangePercent: number | null } | null) {
    if (!priceData || priceData.price === null) return "N/A";
  
    const price = priceData.price.toFixed(2);
    const parts = [];
  
    if (priceData.priceChangePercent !== null) {
      parts.push(formatPercentage(priceData.priceChangePercent));
    }
  
    if (priceData.priceChange !== null) {
      const sign = priceData.priceChange >= 0 ? "+" : "-";
      parts.push(`${sign}${Math.abs(priceData.priceChange).toFixed(2)}`);
    }
  
    return parts.length > 0 ? `${price} (${parts.join(", ")})` : price;
}

const formatPercentage = (percentage: number | null) => {
    if (percentage === null || percentage === undefined) return "";
    const sign = percentage >= 0 ? "+" : "-";
    return `${sign}${(Math.abs(percentage) * 100).toFixed(2)}%`;
}