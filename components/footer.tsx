import {Link} from "@heroui/link";
import React from "react";
import {useTranslations} from "next-intl";

export const Footer: React.FC = () => {
    const t = useTranslations('Footer');

    return (
        <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto px-4 text-center">
                <p>{t('copyright')}</p>
                <Link
                    href="https://www.fu-berlin.de/en/redaktion/impressum/"
                    className="text-white hover:text-gray-300"
                >
                    {t('imprint')}
                </Link>
            </div>
        </footer>
    )
}
