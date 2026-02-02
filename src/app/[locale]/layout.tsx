import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {Providers} from "@/app/[locale]/providers";
import React from "react";
import {routing} from "@/i18n/routing";
import {notFound} from "next/navigation";
import {setRequestLocale, getMessages} from "next-intl/server";

const inter = Inter({subsets: ["latin"]});

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
        <html lang={locale}>
            <body className={inter.className}>
                <Providers messages={messages} locale={locale}>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
