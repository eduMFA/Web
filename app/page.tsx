'use client'

import Image from "next/image";
import React, {useEffect, useState} from "react";
import Link from "next/link";
import organizations from '../data/organizations.json';
import ReactMarkdown from 'react-markdown';

type OrganizationBoxProps = {
    name: string;
    description: string;
    logoSrc: string;
    link: string;
};

const OrganizationBox: React.FC<OrganizationBoxProps> = ({name, description, logoSrc, link}) => {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleBoxClick = () => {
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
    };


    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCloseModal();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-md relative overflow-hidden">
            <div className="h-32 content-center  cursor-pointer" onClick={handleBoxClick}>
                <Image
                    src={logoSrc}
                    alt="Organization Logo"
                    fill={true}
                    objectFit={'contain'}
                    className={'p-2'}
                />
            </div>
            {isModalVisible && (
                <div onClick={handleCloseModal}
                     className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50 ">
                    <div onClick={(e) => e.stopPropagation()}
                         className="bg-white p-8 rounded-lg shadow-md max-w-xl max-h-full overflow-auto relative ">
                        <h2 className="text-xl font-bold mb-2">{name}</h2>
                        <ReactMarkdown className="mb-4">{description}</ReactMarkdown>
                        <Link href={link} className="inline-block bg-blue-500 text-white px-4 py-2 rounded-md">
                            Visit
                        </Link>
                        <button onClick={handleCloseModal} className="absolute top-2 right-2">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                                 stroke="currentColor"
                                 aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Home() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <main className="flex flex-col min-h-screen bg-gray-100">
            <nav className="bg-gray-800">
                <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                    <div className="relative flex h-16 items-center justify-between">
                        <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                            <button
                                type="button"
                                className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                aria-controls="mobile-menu"
                                aria-expanded="false"
                                onClick={() => setIsOpen(!isOpen)}
                            >
                                <span className="sr-only">Open main menu</span>

                                {!isOpen && (
                                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                                         stroke="currentColor"
                                         aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
                                    </svg>
                                )}

                                {isOpen && (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                                         stroke="currentColor"
                                         aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                )}


                            </button>
                        </div>
                        <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                            <div className="flex flex-shrink-0 items-center">
                                <Image
                                    src="/logo.png"
                                    alt="eduMFA Logo"
                                    width={64}
                                    height={64}
                                    priority
                                />
                            </div>
                            <div className="hidden sm:ml-6 sm:block">
                                <div className="flex space-x-4">
                                    <Link href="https://github.com/eduMFA/eduMFA/"
                                          className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium">Github</Link>
                                    <Link href="https://edumfa.readthedocs.io/"
                                          className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium">Documentation</Link>
                                    <Link href="https://www.listserv.dfn.de/sympa/info/edumfa-users"
                                          className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium">Mailing
                                        List</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {isOpen && (
                    <div className="sm:hidden" id="mobile-menu">
                        <div className="space-y-1 px-2 pb-3 pt-2">
                            <Link href="https://github.com/eduMFA/eduMFA/"
                                  className="text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium">Github</Link>
                            <Link href="https://edumfa.readthedocs.io/"
                                  className="text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium">Documentation</Link>
                            <Link href="https://www.listserv.dfn.de/sympa/info/edumfa-users"
                                  className="text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium">Mailing
                                List</Link>
                        </div>
                    </div>
                )}
            </nav>

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
                    <div
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {organizations.map((org, index) => (
                            <OrganizationBox
                                key={index}
                                name={org.name}
                                description={org.description}
                                logoSrc={org.logoSrc}
                                link={org.link}
                            />
                        ))}
                    </div>
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
                        You can learn more about the installation process in the <a
                        href="https://edumfa.readthedocs.io/en/latest/installation/index.html"
                        className="text-blue-600 hover:underline">documentation</a>.
                    </p>
                </section>

            </div>

            <footer className="bg-gray-800 text-white py-4">
                <div className="container mx-auto px-4 text-center">
                    <p>&copy; 2024 eduMFA. All rights reserved.</p>
                    <Link href="https://hm.edu/impressum/index.de.html"
                          className="text-white hover:text-gray-300">Imprint</Link>
                </div>
            </footer>
        </main>
    );
}
