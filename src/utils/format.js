export function formatNaira(amount) {
  return '₦' + Number(amount || 0).toLocaleString()
}