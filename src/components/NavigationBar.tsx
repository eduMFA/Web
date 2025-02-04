import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle
} from "@heroui/navbar";
import React from "react";
import Image from "next/image";
import {Link} from "@heroui/link";
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
        <Navbar
            shouldHideOnScroll
            isMenuOpen={isMenuOpen}
            onMenuOpenChange={setIsMenuOpen}
            maxWidth="2xl"
        >
            <NavbarContent className="sm:hidden" justify="start">
                <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"}/>
            </NavbarContent>

            <NavbarContent className="sm:hidden pr-3" justify="center">
                <NavbarBrand>
                    <Link href="/public">
                        <Image
                            src="/logo.webp"
                            alt="eduMFA Logo"
                            width={128}
                            height={128}
                            priority
                        />
                    </Link>
                </NavbarBrand>
            </NavbarContent>

            <NavbarContent className="hidden mx-auto sm:flex gap-4" justify="start">
                <NavbarBrand>
                    <Link href="/public">
                        <Image
                            src="/logo.webp"
                            alt="eduMFA Logo"
                            width={128}
                            height={128}
                            priority
                        />
                    </Link>
                </NavbarBrand>
                {Object.entries(menuLinks).map(([labelKey, link], index) => (
                    <NavbarItem key={index}>
                        <Link isExternal color="foreground" href={link}>
                            {t(labelKey)}
                        </Link>
                    </NavbarItem>
                ))}
            </NavbarContent>

            <NavbarMenu>
                {Object.entries(menuLinks).map(([labelKey, link], index) => (
                    <NavbarMenuItem key={index}>
                        <Link
                            isExternal
                            href={link}
                            color="foreground"
                            className="w-full"
                        >
                            {t(labelKey)}
                        </Link>
                    </NavbarMenuItem>
                ))}
            </NavbarMenu>
        </Navbar>
    )
}
