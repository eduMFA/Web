import "./globals.css";
import {Providers} from "@/app/[locale]/providers";
import React from "react";
import {routing} from "@/i18n/routing";
import {notFound} from "next/navigation";
import {setRequestLocale, getMessages} from "next-intl/server";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode,
    params: Promise<{locale: string}>
}) {
    const { locale } = await params;

    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    setRequestLocale(locale);
    
    const messages = await getMessages();

    return (
        <Providers messages={messages} locale={locale}>
            {children}
        </Providers>
    );
}
