import {Link} from "@heroui/react";
import React from "react";
import Image from "next/image";
import {useTranslations} from "next-intl";

export const NavigationBar: React.FC = () => {
    const t = useTranslations('NavigationBar');

    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const menuLinks = {
        github: "https://github.com/eduMFA/eduMFA/",
        documentation: "https://edumfa.readthedocs.io/",
        mailingList: "https://www.listserv.dfn.de/sympa/info/edumfa-users"
    }

    return (
        <nav className="sticky top-0 z-40 w-full border-b border-separator bg-background/70 backdrop-blur-lg">
            <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
                <button
                    type="button"
                    className="mr-4 sm:hidden"
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen((open) => !open)}
                >
                    <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={isMenuOpen ? "M6 18 18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                        />
                    </svg>
                </button>
                <div className="flex flex-1 justify-center sm:flex-none">
                    <Link href="/">
                        <Image
                            src="/logo.webp"
                            alt="eduMFA Logo"
                            width={128}
                            height={51}
                            className="h-auto w-32"
                            priority
                        />
                    </Link>
                </div>
                <ul className="ml-4 hidden items-center gap-4 sm:flex">
                    {Object.entries(menuLinks).map(([labelKey, link]) => (
                    <li key={labelKey}>
                        <Link href={link} target="_blank" rel="noopener noreferrer">
                            {t(labelKey)}
                        </Link>
                    </li>
                    ))}
                </ul>
            </div>
            {isMenuOpen && (
                <div className="border-t border-separator sm:hidden">
                    <ul className="flex flex-col gap-2 p-4">
                    {Object.entries(menuLinks).map(([labelKey, link]) => (
                    <li key={labelKey}>
                        <Link
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-2"
                            onPress={() => setIsMenuOpen(false)}
                        >
                            {t(labelKey)}
                        </Link>
                    </li>
                    ))}
                    </ul>
                </div>
            )}
        </nav>
    )
}
