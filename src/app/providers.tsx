import {HeroUIProvider} from "@heroui/system"
import React from "react";
import {NextIntlClientProvider} from "next-intl";
import {getMessages} from "next-intl/server";

export async function Providers({children}: { children: React.ReactNode }) {
    const messages = await getMessages();

    return (
        <NextIntlClientProvider messages={messages}>
            <HeroUIProvider>
                {children}
            </HeroUIProvider>
        </NextIntlClientProvider>
    )
}