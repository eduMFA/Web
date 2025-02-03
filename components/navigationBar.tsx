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

export const NavigationBar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const menuLinks = {
        "Github": "https://github.com/eduMFA/eduMFA/",
        "Documentation": "https://edumfa.readthedocs.io/",
        "Mailing List": "https://www.listserv.dfn.de/sympa/info/edumfa-users"
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
                    <Link href="/">
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
                    <Link href="/">
                        <Image
                            src="/logo.webp"
                            alt="eduMFA Logo"
                            width={128}
                            height={128}
                            priority
                        />
                    </Link>
                </NavbarBrand>
                {Object.entries(menuLinks).map(([label, link], index) => (
                    <NavbarItem key={index}>
                        <Link isExternal color="foreground" href={link}>
                            {label}
                        </Link>
                    </NavbarItem>
                ))}
            </NavbarContent>

            <NavbarMenu>
                {Object.entries(menuLinks).map(([label, link], index) => (
                    <NavbarMenuItem key={`${label}-${index}`}>
                        <Link
                            isExternal
                            href={link}
                            color="foreground"
                            className="w-full"
                        >
                            {label}
                        </Link>
                    </NavbarMenuItem>
                ))}
            </NavbarMenu>
        </Navbar>
    )
}
