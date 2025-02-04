import {getRequestConfig} from 'next-intl/server';
import {headers} from "next/headers";


export default getRequestConfig(async () => {
    const locale = (await headers()).get('accept-language')?.split(',')[0].split('-')[0] || 'en';
    try {
        return {
            locale,
            messages: (await import(`../../messages/${locale}.json`)).default
        };
    } catch (e) {
        return {
            locale: 'en',
            messages: (await import(`../../messages/en.json`)).default
        }
    }
});