"use client";

import {HeroUIProvider} from "@heroui/react"
import React from "react";
import {NextIntlClientProvider, AbstractIntlMessages} from "next-intl";

interface ProvidersProps {
    children: React.ReactNode;
    messages: AbstractIntlMessages;
    locale: string;
}

export function Providers({children, messages, locale}: ProvidersProps) {
    return (
        <NextIntlClientProvider messages={messages} locale={locale}>
            <HeroUIProvider>
                {children}
            </HeroUIProvider>
        </NextIntlClientProvider>
    )
}
