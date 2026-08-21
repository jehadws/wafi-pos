import Settings from "@/lib/settings";
import { enUS } from 'date-fns/locale';
import NumeralJS from "numeral";
import { format, toZonedTime } from 'date-fns-tz';
import { parse } from "date-fns";

export const formatCurrency = (amount: number) => {
  let currency: any = {
    ns_currency_symbol: '$',
    ns_currency_position: 'before',
    ns_currency_thousand_separator: ',',
    ns_currency_decimal_separator: '.',
    ns_currency_precision: 2,
  };

  try {
    const settings = Settings.get();
    if (settings?.currency) {
      currency = settings.currency;
    }
  } catch {
    // fallback to default currency formatting
  }

  const { ns_currency_symbol, ns_currency_position, ns_currency_thousand_separator, ns_currency_decimal_separator, ns_currency_precision } = currency;
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const formattedAmount = num.toFixed(ns_currency_precision || 2).replace('.', ns_currency_decimal_separator || '.').replace(/\B(?=(\d{3})+(?!\d))/g, ns_currency_thousand_separator || ',');

  if (ns_currency_position === 'before') {
    return `${ns_currency_symbol || '$'}${formattedAmount}`;
  }

  return `${formattedAmount}${ns_currency_symbol || '$'}`;
}

export const rawCurrency = (value: any) => {
  const numeralFormat = `0.000000000`;
  return parseFloat(NumeralJS(value).format(numeralFormat));
}

const phpToDateFnsFormat = (phpFormat: string): string => {
  const formatMap: { [key: string]: string } = {
    // Date formats
    'Y-m-d': 'yyyy-MM-dd',
    'Y/m/d': 'yyyy/MM/dd',
    'd-m-y': 'dd-MM-yyyy',
    'd/m/y': 'dd/MM/yyyy',
    'M dS, Y': 'MMM do, yyyy',
    'd M Y': 'dd MMM yyyy',
    'd.m.Y': 'dd.MM.yyyy',
    // Datetime formats
    'Y-m-d H:i': 'yyyy-MM-dd hh:mm a',
    'Y/m/d H:i': 'yyyy/MM/dd hh:mm a',
    'd-m-y H:i': 'dd-MM-yyyy hh:mm a',
    'd/m/y H:i': 'dd/MM/yyyy hh:mm a',
    'M dS, Y H:i': 'MMM do, yyyy hh:mm a',
    'd M Y, H:i': 'dd MMM yyyy, hh:mm a',
    'd.m.Y, H:i': 'dd.MM.yyyy, hh:mm a',
  };
  return formatMap[phpFormat] || phpFormat;
};

// Create a reverse mapping for parsing
const phpToDateFnsParseFormat = (phpFormat: string): string => {
  const formatMap: { [key: string]: string } = {
    'd.m.Y, H:i': 'dd.MM.yyyy, HH:mm',
    'd.m.Y': 'dd.MM.yyyy',
    'd-m-y H:i': 'dd-MM-yyyy HH:mm',
    'd/m/y H:i': 'dd/MM/yyyy HH:mm',
    'Y-m-d H:i': 'yyyy-MM-dd HH:mm',
    'Y/m/d H:i': 'yyyy/MM/dd HH:mm',
    // Add other formats as needed
  };
  return formatMap[phpFormat] || phpFormat;
};

// export const formatDate = (dateString: string) => {
//   const { date } = Settings.get();
//   const { ns_date_format } = date;
//   if (!dateString) {
//     return '';
//   }
//   const dateFnsFormat = phpToDateFnsFormat(ns_date_format || 'Y-m-d');
//   return format(new Date(dateString), dateFnsFormat);
// }

export const formatDate = (dateString: string) => {
  let dateConfig: any = { ns_date_format: 'Y-m-d', ns_datetime_timezone: 'UTC' };
  try {
    const settings = Settings.get();
    if (settings?.date) {
      dateConfig = settings.date;
    }
  } catch {
    // fallback
  }

  const { ns_date_format, ns_datetime_timezone } = dateConfig;
  if (!dateString) {
    return '';
  }

  let parsedDate = new Date(dateString);
  
  if (isNaN(parsedDate.getTime())) {
    // Fallback for "YYYY-MM-DD HH:mm:ss" format
    const cleanedDateString = dateString.replace(' ', 'T');
    parsedDate = new Date(cleanedDateString);
    
    if (isNaN(parsedDate.getTime())) {
      return dateString;
    }
  }

  const zonedDate = toZonedTime(parsedDate, ns_datetime_timezone || 'UTC');
  const dateFnsFormat = phpToDateFnsFormat(ns_date_format || 'Y-m-d');
  
  return format(zonedDate, dateFnsFormat, {
    locale: enUS,
    timeZone: ns_datetime_timezone || 'UTC'
  });
}

export const formatDateTime = (dateString: string) => {
  let dateConfig: any = { ns_datetime_format: 'Y-m-d H:i', ns_datetime_timezone: 'UTC' };
  try {
    const settings = Settings.get();
    if (settings?.date) {
      dateConfig = settings.date;
    }
  } catch {
    // fallback
  }

  const { ns_datetime_format, ns_datetime_timezone } = dateConfig;

  if (!dateString) {
    return '';
  }

  let parsedDate = new Date(dateString);
  
  if (isNaN(parsedDate.getTime())) {
    // Fallback for some non-standard date strings
    const cleanedDateString = dateString
      .replace(/\./g, '-')  // Replace dots with dashes
      .replace(/,/g, '')    // Remove commas
      .replace(' ', 'T');   // Handle "YYYY-MM-DD HH:mm:ss"

    parsedDate = new Date(cleanedDateString);
    
    if (isNaN(parsedDate.getTime())) {
      return dateString; // Return original if all parsing fails
    }
  }

  // Convert to the desired timezone
  const zonedDate = toZonedTime(parsedDate, ns_datetime_timezone || 'UTC');

  // Format for display
  const displayFormat = phpToDateFnsFormat(ns_datetime_format || 'Y-m-d H:i');

  return format(zonedDate, displayFormat, {
    locale: enUS,
    timeZone: ns_datetime_timezone || 'UTC'
  });
};
