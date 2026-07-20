const usdCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function formatUsdPrice(price) {
  return usdCurrencyFormatter.format(price)
}
