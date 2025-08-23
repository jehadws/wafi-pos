import Settings from "@/lib/settings";

export const formatCurrency = (amount: number) => {
  const { currency } = Settings.get();
  const { ns_currency_symbol, ns_currency_position, ns_currency_thousand_separator, ns_currency_decimal_separator, ns_currency_precision } = currency;
  const formattedAmount = amount.toFixed(ns_currency_precision || 2).replace('.', ns_currency_decimal_separator || '.').replace(/\B(?=(\d{3})+(?!\d))/g, ns_currency_thousand_separator || ',');

  if (ns_currency_position === 'before') {
    return `${ns_currency_symbol}${formattedAmount}`;
  }

  return `${formattedAmount}${ns_currency_symbol}`;
}

export const rawCurrency = (value) => {
  const numeralFormat = `0.000000000`;

  // return parseFloat(NumeralJS(value).format(numeralFormat));
  return parseFloat(value);
}

export const formatDate = (dateString: string) => {
  const { date } = Settings.get();
  const { ns_date_format } = date;
  // This is a simplified example. You might need a more robust date formatting library like date-fns or moment.js to handle all the date formats from the backend.
  return new Date(dateString).toLocaleDateString();
}
