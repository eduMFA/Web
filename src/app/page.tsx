'use client'

import {useEffect} from "react";
import {redirect} from "next/navigation";
import {routing} from "@/i18n/routing";

export default function RootPage() {

    useEffect(() => {
        let locale = navigator.language.split('-')[0];
        if (!locale || !routing.locales.includes(locale as any)) {
            locale = routing.defaultLocale;
        }
        redirect(`/${locale}`)
    }, [])

    return <p>Redirecting...</p>;
}