import type {Messages} from "@lingui/core";
import type {Locale} from "./routing";
import {messages as deMessages} from "../locales/de/messages";
import {messages as enMessages} from "../locales/en/messages";

const messagesByLocale: Record<Locale, Messages> = {
    de: deMessages,
    en: enMessages,
};

export function loadMessages(locale: Locale): Messages {
    return messagesByLocale[locale];
}
