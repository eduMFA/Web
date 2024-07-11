'use client'

import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle
} from "@nextui-org/navbar";
import Image from "next/image";
import React from "react";
import organizationData from "@/data/users.json";
import {User} from "@/types/organizationTypes";
import {Link} from "@nextui-org/link";
import {ScrollShadow} from "@nextui-org/scroll-shadow";
import {OrganizationBox} from "@/components/organizationBox";

const organizations = organizationData as User[];

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const menuLinks = {
        "Github": "https://github.com/eduMFA/eduMFA/",
        "Documentation": "https://edumfa.readthedocs.io/",
        "Mailing List": "https://www.listserv.dfn.de/sympa/info/edumfa-users"
    }


    return (
        <main className="flex flex-col min-h-screen bg-gray-100">
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
                        <Image
                            src="/logo.svg"
                            alt="eduMFA Logo"
                            width={128}
                            height={128}
                            priority
                        />
                    </NavbarBrand>
                </NavbarContent>

                <NavbarContent className="hidden mx-auto sm:flex gap-4" justify="start">
                    <NavbarBrand>
                        <Image
                            src="/logo.svg"
                            alt="eduMFA Logo"
                            width={128}
                            height={128}
                            priority
                        />
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

            <div className="container mx-auto px-4 py-8 flex-grow">
                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">About eduMFA</h2>
                    <p className="text-gray-700">
                        eduMFA is a modular authentication system that enhances existing applications with a second
                        factor
                        during authentication, boosting security. Originally used for OTP authentication devices, it now
                        supports other methods like challenge response and SSH keys. It runs on Linux and is completely
                        open
                        source, licensed under the AGPLv3.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Why eduMFA?</h2>
                    <p className="text-gray-700">
                        eduMFA provides enhanced protection against hacking attacks for IT services in the academic
                        network. It
                        enables multi-factor authentication, making traditional username-password combinations obsolete.
                        The
                        &apos;Passkeys&apos; method, a focus of eduMFA, locks a security key into a safe, accessible
                        only through
                        additional
                        methods like biometric scans or PINs. Passkeys are resistant to phishing attacks, can be
                        synchronized
                        between compatible devices, and offer a seamless user experience with strong, secure
                        authentication. eduMFA
                        is already in use at several universities and is being further developed according to the
                        requirements of
                        the scientific community.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Organizations Using eduMFA</h2>
                    <ScrollShadow className="max-h-96">
                        <div
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4">
                            {organizations.map((org, index) => (
                                <OrganizationBox user={org} key={index}/>
                            ))}
                        </div>
                    </ScrollShadow>
                </section>


                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Installation</h2>
                    <p className="text-gray-700">
                        The system is written in Python, uses Flask as the web framework, and an SQL database as the
                        datastore.
                        Installation is straightforward, providing a lean installation process.
                    </p>
                    <br/>
                    <p className="text-gray-700">
                        You can learn more about the installation process in the <Link
                        href={"https://edumfa.readthedocs.io/en/latest/installation/index.html"} target={"_blank"}
                        className="text-blue-600 hover:underline">documentation</Link>.
                    </p>
                </section>
            </div>

            <footer className="bg-gray-800 text-white py-4">
                <div className="container mx-auto px-4 text-center">
                    <p>&copy; 2024 eduMFA. All rights reserved.</p>
                    <Link href="https://www.fu-berlin.de/en/redaktion/impressum/index.html"
                          className="text-white hover:text-gray-300">Imprint</Link>
                </div>
            </footer>
        </main>
    );
}