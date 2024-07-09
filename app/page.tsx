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
import {OrganizationImplementationPhase, User} from "@/types/organizationTypes";
import {Card} from "@nextui-org/card";
import {Modal, ModalBody, ModalContent, ModalHeader, useDisclosure} from "@nextui-org/modal";
import {Link} from "@nextui-org/link";
import {Tooltip} from "@nextui-org/tooltip";
import {Chip} from "@nextui-org/chip";
import {ScrollShadow} from "@nextui-org/scroll-shadow";

const organizations = organizationData as User[];

interface OrganizationBoxProps {
    user: User
}
const OrganizationBox: React.FC<OrganizationBoxProps> = ({user}) => {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();

    return (
        <>
            <Card isPressable className="h-32 content-center border-none" onPress={() => onOpen()}>
                <Image
                    src={user.logoSrc}
                    alt={user.name}
                    fill={true}
                    className={'p-2 object-contain'}
                />
            </Card>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader  className="flex flex-col gap-1">
                                <Link isExternal showAnchorIcon href={user.link} color="foreground">{user.name}</Link>
                            </ModalHeader>
                            <ModalBody>
                                {user.userCount != undefined && (
                                    <div className="flex items-center mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                             stroke-width="1.5" stroke="currentColor" className="size-5 mr-2">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                                        </svg>
                                        <p className=" text-gray-700">Approx. User Count: <span
                                            className="font-bold">{new Intl.NumberFormat('en', {
                                            notation: 'compact',
                                            maximumFractionDigits: 2
                                        },).format(user.userCount)}</span></p>
                                    </div>
                                )}
                                {user.phase && (
                                    <div className="flex items-center mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                             stroke-width="1.5" stroke="currentColor" className="size-5 mr-2">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                  d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
                                        </svg>
                                        <p className=" text-gray-700 pr-2">Implementation Phase: </p>
                                        <Tooltip showArrow content="Evaluation">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${user.phase === OrganizationImplementationPhase.EVALUATION ? 'bg-blue-500 text-white' : 'bg-gray-300'} mr-2 group relative`}>
                                                E
                                            </div>
                                        </Tooltip>
                                        <Tooltip showArrow content="Testing">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${user.phase === OrganizationImplementationPhase.TESTING ? 'bg-yellow-500 text-black' : 'bg-gray-300'} mr-2 group relative`}>
                                                T
                                            </div>
                                        </Tooltip>
                                        <Tooltip showArrow content="Production">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${user.phase === OrganizationImplementationPhase.PRODUCTION ? 'bg-green-500 text-white' : 'bg-gray-300'} mr-2 group relative`}>
                                                P
                                            </div>
                                        </Tooltip>
                                    </div>
                                )}
                                {user.tokenTypes && user.tokenTypes.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                 stroke-width="1.5" stroke="currentColor" className="size-6 mr-2">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                      d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"/>
                                            </svg>
                                            <p className="text-gray-700">Token Types:</p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {user.tokenTypes.map((type, index) => (
                                                <Chip key={index}>{type}</Chip>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {user.userCount == undefined && user.phase == undefined && (user.tokenTypes == undefined || user.tokenTypes.length === 0) && (
                                    <p className="text-gray-700 mb-4">No additional information available.</p>
                                )}
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

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