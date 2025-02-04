import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {Providers} from "@/src/app/[locale]/providers";
import React from "react";
import {routing} from "@/src/i18n/routing";
import {notFound} from "next/navigation";
import {setRequestLocale} from "next-intl/server";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "eduMFA",
    description: "Up-to-date multifactor authentication for academic institutions",
    openGraph: {
        title: "eduMFA",
        type: "website",
        url: "https://edumfa.com",
    }
};

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

    return (
        <html lang={locale}>
            <body className={inter.className}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
