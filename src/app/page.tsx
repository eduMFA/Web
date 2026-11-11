"use client";

import {useEffect} from "react";
import {redirect} from "next/navigation";
import {defaultLocale, isLocale} from "@/i18n/routing";

export default function RootPage() {
    useEffect(() => {
        const detectedLocale = navigator.language.split("-")[0] ?? "";
        const locale = isLocale(detectedLocale) ? detectedLocale : defaultLocale;
        redirect(`/${locale}`);
    }, []);

    return <p>Redirecting...</p>;
}
