'use client'

import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle
} from "@heroui/navbar";
import Image from "next/image";
import React from "react";
import organizationData from "@/data/users.json";
import {User} from "@/types/organizationTypes";
import {Link} from "@heroui/link";
import {ScrollShadow} from "@heroui/scroll-shadow";
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
                            src="/logo.webp"
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
                            src="/logo.webp"
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
                        eduMFA is a comprehensive authentication system that enhances existing applications with
                        multi-factor authentication, significantly improving security. Originally forked from
                        privacyIDEA version 3.9.2, eduMFA has evolved into a robust solution deeply integrated with
                        Shibboleth, making
                        it particularly suited for academic and research environments. It supports various
                        authentication methods, including OTP devices, challenge-response mechanisms, SSH keys, and the
                        cutting-edge Passkeys technology.
                    </p>
                    <p className="text-gray-700 mt-2">
                        Running on Linux and entirely open-source under the AGPLv3 license, eduMFA offers a flexible and
                        powerful plugin system. This allows for seamless integration with various identity management
                        systems and applications, extending its functionality to meet diverse authentication needs. All
                        features of eduMFA can be used free of charge.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Key Features and Goals</h2>
                    <ul className="list-disc list-inside text-gray-700">
                        <li>Multi-factor authentication support for enhanced security</li>
                        <li>Deep integration with Shibboleth for academic and research environments</li>
                        <li>Support for modern authentication methods, including Passkeys</li>
                        <li>Easy migration path from privacyIDEA and other authentication systems</li>
                        <li>Continuous development based on the scientific community&apos;s requirements</li>
                        <li>Focus on using and maintaining up-to-date, current software components</li>
                        <li>Support for the latest Python versions (currently Python 3.8 to 3.12)</li>
                        <li>Official support for container deployment, enabling seamless scaling in Kubernetes
                            clusters
                        </li>
                        <li>eduMFA Authenticator App for push notifications</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Why Choose eduMFA?</h2>
                    <p className="text-gray-700">
                        eduMFA provides robust protection against hacking attacks for IT services in academic networks
                        and beyond. By enabling multi-factor authentication, it renders traditional username-password
                        combinations obsolete. The &apos;Passkeys&apos; method, a key focus of eduMFA, securely stores
                        authentication keys, accessible only through additional methods like biometric scans or PINs.
                        This approach offers strong resistance to phishing attacks, allows synchronization between
                        compatible devices, and delivers a seamless user experience without compromising on security.
                    </p>
                    <p className="text-gray-700 mt-2">
                        Already in use at several universities across Europe, including institutions in Germany, Czech
                        Republic, and Norway, eduMFA is continuously evolving to meet the dynamic
                        needs of the scientific and broader IT community. Its commitment to using current, up-to-date
                        software ensures that users always have access to the latest security features and improvements.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Support and Development</h2>
                    <p className="text-gray-700">
                        eduMFA benefits from a strong support network and an active development community:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 mt-2">
                        <li>Commercial support, consulting, implementation, 2nd-level support, and managed services are
                            available from trusted companies like DAASI International, GWDG, and Ssystems.
                        </li>
                        <li>The development team includes contributors from leading institutions such as Freie
                            Universität Berlin, GWDG, Hochschule München, and University of Bamberg.
                        </li>
                        <li>This collaborative approach ensures that eduMFA remains at the forefront of authentication
                            technology, addressing real-world needs in academic and research environments.
                        </li>
                        <li>A <Link href="https://www.listserv.dfn.de/sympa/info/edumfa-users" isExternal
                                    showAnchorIcon>user mailing list</Link> is available for community support and
                            discussions.
                        </li>
                        <li>Issues and feature requests can be submitted on the GitHub repository.</li>
                    </ul>
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
                    <p className="text-gray-500 mt-2 text-sm italic">
                        Is your organization using eduMFA? <Link
                        href="https://github.com/eduMFA/Web/issues/new?labels=organization&title=%5BOrg%5D+&template=manage_organization.yml"
                        isExternal>Add it to the list</Link>.
                    </p>
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
                        href="https://edumfa.readthedocs.io/en/latest/installation/index.html" isExternal
                        showAnchorIcon>documentation</Link>.
                    </p>
                </section>
            </div>

            <footer className="bg-gray-800 text-white py-4">
                <div className="container mx-auto px-4 text-center">
                    <p>&copy; 2024 eduMFA. All rights reserved.</p>
                    <Link href="https://www.fu-berlin.de/en/redaktion/impressum/"
                          className="text-white hover:text-gray-300">Imprint</Link>
                </div>
            </footer>
        </main>
    );
}