export const formatCurrency = (amount: number) => {
  return `USD${amount.toFixed(2)}`
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
