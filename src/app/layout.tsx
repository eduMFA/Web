import React from "react";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "eduMFA",
    description: "Up-to-date multifactor authentication for academic institutions",
    openGraph: {
        title: "eduMFA",
        type: "website",
        url: "https://edumfa.com",
    }
};

export default function RootLayout({ children } : { children: React.ReactNode }) {
    return children;
}