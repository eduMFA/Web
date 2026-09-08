"use client";

import React from "react";
import {setupI18n, type Messages} from "@lingui/core";
import {I18nProvider} from "@lingui/react";

interface ProvidersProps {
    children: React.ReactNode;
    messages: Messages;
    locale: string;
}

export function Providers({children, messages, locale}: ProvidersProps) {
    const [i18n] = React.useState(() => setupI18n({
        locale,
        messages: {[locale]: messages},
    }));

    return (
        <I18nProvider i18n={i18n}>
            {children}
        </I18nProvider>
    )
}
