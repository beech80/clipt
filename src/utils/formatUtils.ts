import { format, formatDistance, formatRelative, Locale } from "date-fns";
import { ar, es, fr, zhCN } from "date-fns/locale";

const locales: { [key: string]: Locale } = {
  ar,
  es,
  fr,
  zh: zhCN,
};

export const formatDate = (date: Date | string, formatStr: string, locale: string = "en") => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, formatStr, {
    locale: locales[locale] || undefined,
  });
};

export const formatRelativeTime = (date: Date | string, locale: string = "en") => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), {
    addSuffix: true,
    locale: locales[locale] || undefined,
  });
};

export const formatNumber = (num: number, locale: string = "en") => {
  return new Intl.NumberFormat(locale).format(num);
};

export const formatCurrency = (amount: number, currency: string = "USD", locale: string = "en") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
};