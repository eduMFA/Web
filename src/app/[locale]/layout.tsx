import "./globals.css";
import {Providers} from "@/app/[locale]/providers";
import React from "react";
import {isLocale, locales} from "@/i18n/routing";
import {notFound} from "next/navigation";
import {loadMessages} from "@/i18n/messages";

export function generateStaticParams() {
    return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
}) {
    const {locale} = await params;

    if (!isLocale(locale)) {
        notFound();
    }

    const messages = await loadMessages(locale);

    return (
        <Providers messages={messages} locale={locale}>
            {children}
        </Providers>
    );
}
