export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(locale: string): locale is Locale {
    return locales.some((supportedLocale) => supportedLocale === locale);
}
