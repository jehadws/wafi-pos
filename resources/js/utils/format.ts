import Settings from "@/lib/settings";
import { enUS } from 'date-fns/locale';
import NumeralJS from "numeral";
import { format, toZonedTime } from 'date-fns-tz';

/**
 * Dev-only warning for the silent-fallback path: format utils catch the
 * "Settings have not been initialized" throw and fall back to $/UTC
 * defaults. In production the fallback stands (a crash is worse); in dev
 * this surfaces initialization-order bugs the first time they fire.
 */
let warnedUninitializedSettings = false;
const warnUninitializedSettings = (context: string) => {
    if (warnedUninitializedSettings || import.meta.env?.PROD) return;
    warnedUninitializedSettings = true;
    console.warn(
        `[format] ${context}: app settings are not initialized yet — using default formatting. ` +
            'Settings are hydrated in app.tsx; render the app only after that.',
    );
};

/**
 * Resolve the currency precision from a settings payload.
 *
 * Accepts numbers or numeric strings in the 0..5 range the settings form
 * offers (GeneralSettings.php); anything else (null, undefined, NaN, out of
 * range) falls back to 2. Never use `|| 2` for this: a deliberate precision
 * of 0 is valid and falsy, so `||` silently rewrites it to 2.
 */
export const resolveCurrencyPrecision = (value: number | string | null | undefined): number => {
    const parsed = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 5 ? parsed : 2;
};

export const formatCurrency = (amount: number) => {
  let currency: any = {
    sb_currency_symbol: '$',
    sb_currency_position: 'before',
    sb_currency_thousand_separator: ',',
    sb_currency_decimal_separator: '.',
    sb_currency_precision: 2,
  };

  try {
    const settings = Settings.get();
    if (settings?.currency) {
      currency = settings.currency;
    }
  } catch {
    warnUninitializedSettings('formatCurrency');
  }

  const { sb_currency_symbol, sb_currency_position, sb_currency_thousand_separator, sb_currency_decimal_separator, sb_currency_precision } = currency;
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const precision = resolveCurrencyPrecision(sb_currency_precision);
  const formattedAmount = num.toFixed(precision).replace('.', sb_currency_decimal_separator || '.').replace(/\B(?=(\d{3})+(?!\d))/g, sb_currency_thousand_separator || ',');

  if (sb_currency_position === 'before') {
    return `${sb_currency_symbol || '$'}${formattedAmount}`;
  }

  return `${formattedAmount}${sb_currency_symbol || '$'}`;
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

export const formatDate = (dateString: string | null | undefined) => {
  let dateConfig: any = { sb_date_format: 'Y-m-d', sb_datetime_timezone: 'UTC' };
  try {
    const settings = Settings.get();
    if (settings?.date) {
      dateConfig = settings.date;
    }
  } catch {
    warnUninitializedSettings('formatDate');
  }

  const { sb_date_format, sb_datetime_timezone } = dateConfig;
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

  const zonedDate = toZonedTime(parsedDate, sb_datetime_timezone || 'UTC');
  const dateFnsFormat = phpToDateFnsFormat(sb_date_format || 'Y-m-d');
  
  return format(zonedDate, dateFnsFormat, {
    locale: enUS,
    timeZone: sb_datetime_timezone || 'UTC'
  });
}

export const formatDateTime = (dateString: string | null | undefined) => {
  let dateConfig: any = { sb_datetime_format: 'Y-m-d H:i', sb_datetime_timezone: 'UTC' };
  try {
    const settings = Settings.get();
    if (settings?.date) {
      dateConfig = settings.date;
    }
  } catch {
    warnUninitializedSettings('formatDateTime');
  }

  const { sb_datetime_format, sb_datetime_timezone } = dateConfig;

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
  const zonedDate = toZonedTime(parsedDate, sb_datetime_timezone || 'UTC');

  // Format for display
  const displayFormat = phpToDateFnsFormat(sb_datetime_format || 'Y-m-d H:i');

  return format(zonedDate, displayFormat, {
    locale: enUS,
    timeZone: sb_datetime_timezone || 'UTC'
  });
};
