export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(locale: string): locale is Locale {
    return locales.some((supportedLocale) => supportedLocale === locale);
}

export function detectLocale(acceptLanguage: string | null): Locale {
    const preferences = (acceptLanguage ?? "")
        .split(",")
        .map((preference) => {
            const [language = "", ...parameters] = preference.trim().split(";");
            const quality = parameters.find((parameter) => parameter.trim().startsWith("q="));
            return {
                locale: language.toLowerCase().split("-")[0] ?? "",
                quality: quality === undefined ? 1 : Number(quality.trim().slice(2)),
            };
        })
        .filter(({quality}) => quality > 0 && quality <= 1)
        .sort((a, b) => b.quality - a.quality);

    for (const {locale} of preferences) {
        if (isLocale(locale)) return locale;
    }

    return defaultLocale;
}
