import React from "react";
import type {Metadata} from "next";
import {Inter} from "next/font/google";
import {headers} from "next/headers";
import {detectLocale} from "@/i18n/routing";
import {loadMessages} from "@/i18n/messages";
import {Providers} from "./providers";
import "./globals.css";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "eduMFA",
    description: "Up-to-date multifactor authentication for academic institutions",
    openGraph: {
        title: "eduMFA",
        type: "website",
        url: "https://edumfa.io",
    },
    alternates: {
        canonical: "https://edumfa.io",
    },
};

export default async function RootLayout({children}: {children: React.ReactNode}) {
    const locale = detectLocale((await headers()).get("accept-language"));
    const messages = loadMessages(locale);

    return (
        <html lang={locale}>
            <body className={inter.className}>
                <Providers key={locale} messages={messages} locale={locale}>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
