import React from "react"

export function formatCurrency(amount: number) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  // Returning a JSX element to ensure consistent font rendering for the currency symbol and amount.
  // The 'font-sans' class will leverage the updated font stack in tailwind.config.ts
  return <span className="font-sans">৳{formattedAmount}</span>;
}
