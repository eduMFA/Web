import React from "react";
import type {Metadata} from "next";
import {Inter} from "next/font/google";
import {routing} from "@/i18n/routing";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "eduMFA",
    description: "Up-to-date multifactor authentication for academic institutions",
    openGraph: {
        title: "eduMFA",
        type: "website",
        url: "https://edumfa.com",
    },
    alternates: {
        canonical: "https://edumfa.io",
        languages: routing.locales.reduce((acc: Record<string, string>, locale) => {
            acc[locale] = `https://edumfa.io/${locale}`;
            return acc;
        }, { "x-default": "https://edumfa.io/en" })
    }
};

export default function RootLayout({ children } : { children: React.ReactNode }) {

    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    )
}