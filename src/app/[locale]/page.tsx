"use client";

import React from "react";
import {useParams} from "next/navigation";
import organizationData from "@/data/users.json";
import {User} from "@/types/organizationTypes";
import {Link, ScrollShadow} from "@heroui/react";
import {OrganizationBox} from "@/components/OrganizationBox";
import {NavigationBar} from "@/components/NavigationBar";
import {Trans} from "@lingui/react/macro";
import {Footer} from "@/components/Footer";

const organizations = organizationData as User[];

export default function Home() {
    const {locale} = useParams<{locale: string}>();
    const minPyVersion = "3.9";
    const maxPyVersion = "3.13";

    return (
        <main className="flex flex-col min-h-screen bg-gray-100">
            <NavigationBar />
            <div className="container mx-auto px-4 py-8 grow">
                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">
                        <Trans id="HomePage.aboutTitle">About eduMFA</Trans>
                    </h2>
                    <p className="text-gray-700">
                        <Trans id="HomePage.aboutContent">
                            eduMFA is a comprehensive authentication system that enhances existing applications with
                            multi-factor authentication, significantly improving security. Originally forked from
                            privacyIDEA version 3.9.2, eduMFA has evolved into a robust solution deeply integrated with
                            Shibboleth, making it particularly suited for academic and research environments. It
                            supports various authentication methods, including OTP devices, challenge-response
                            mechanisms, SSH keys, and the cutting-edge Passkeys technology.
                            <br />
                            <br />
                            Running on Linux and entirely open-source under the AGPLv3 license, eduMFA offers a flexible
                            and powerful plugin system. This allows for seamless integration with various identity
                            management systems and applications, extending its functionality to meet diverse
                            authentication needs. All features of eduMFA can be used free of charge.
                        </Trans>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">
                        <Trans id="HomePage.featuresTitle">Key Features and Goals</Trans>
                    </h2>
                    <div className="text-gray-700">
                        <Trans id="HomePage.featuresContent">
                            <ul className="list-disc list-inside mt-2">
                                <li>Multi-factor authentication support for enhanced security</li>
                                <li>Deep integration with Shibboleth for academic and research environments</li>
                                <li>Support for modern authentication methods, including Passkeys</li>
                                <li>Easy migration path from privacyIDEA and other authentication systems</li>
                                <li>Continuous development based on the scientific community&apos;s requirements</li>
                                <li>Focus on using and maintaining up-to-date, current software components</li>
                                <li>
                                    Support for the latest Python versions (currently Python {minPyVersion} to{" "}
                                    {maxPyVersion})
                                </li>
                                <li>
                                    Official support for container deployment, enabling seamless scaling in Kubernetes
                                    clusters
                                </li>
                                <li>eduMFA Authenticator App for push notifications</li>
                            </ul>
                        </Trans>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">
                        <Trans id="HomePage.reasonTitle">Why Choose eduMFA?</Trans>
                    </h2>
                    <p className="text-gray-700">
                        <Trans id="HomePage.reasonContent">
                            eduMFA provides robust protection against hacking attacks for IT services in academic
                            networks and beyond. By enabling multi-factor authentication, it renders traditional
                            username-password combinations obsolete. The &apos;Passkeys&apos; method, a key focus of
                            eduMFA, securely stores authentication keys, accessible only through additional methods like
                            biometric scans or PINs. This approach offers strong resistance to phishing attacks, allows
                            synchronization between compatible devices, and delivers a seamless user experience without
                            compromising on security.
                            <br />
                            <br />
                            Already in use at several universities across Europe, including institutions in Germany,
                            Czech Republic, and Norway, eduMFA is continuously evolving to meet the dynamic needs of the
                            scientific and broader IT community. Its commitment to using current, up-to-date software
                            ensures that users always have access to the latest security features and improvements.
                        </Trans>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">
                        <Trans id="HomePage.supportTitle">Support and Development</Trans>
                    </h2>
                    <div className="text-gray-700">
                        <Trans id="HomePage.supportContent">
                            eduMFA benefits from a strong support network and an active development community:
                            <ul className="list-disc list-inside mt-2">
                                <li>
                                    Commercial support, consulting, implementation, 2nd-level support, and managed
                                    services are available from trusted companies like DAASI International, GWDG, and
                                    Ssystems.
                                </li>
                                <li>
                                    The development team includes contributors from leading institutions such as Freie
                                    Universität Berlin, GWDG, Hochschule München, and University of Bamberg.
                                </li>
                                <li>
                                    This collaborative approach ensures that eduMFA remains at the forefront of
                                    authentication technology, addressing real-world needs in academic and research
                                    environments.
                                </li>
                                <li>
                                    A{" "}
                                    <Link
                                        href="https://www.listserv.dfn.de/sympa/info/edumfa-users"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        user mailing list
                                        <Link.Icon />
                                    </Link>{" "}
                                    is available for community support and discussions.
                                </li>
                                <li>Issues and feature requests can be submitted on the GitHub repository.</li>
                            </ul>
                        </Trans>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">
                        <Trans id="HomePage.orgTitle">Organizations Using eduMFA</Trans>
                    </h2>
                    <ScrollShadow className="max-h-96">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4">
                            {organizations.map((org, index) => (
                                <OrganizationBox user={org} key={index} />
                            ))}
                        </div>
                    </ScrollShadow>
                    <p className="text-gray-500 mt-2 text-sm italic">
                        <Trans id="HomePage.orgFooter">
                            <Link
                                href="https://github.com/eduMFA/Web/issues/new/choose"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Add, update, or remove your organization listing
                                <Link.Icon />
                            </Link>
                            .
                        </Trans>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">
                        <Trans id="HomePage.installTitle">Installation</Trans>
                    </h2>
                    <p className="text-gray-700">
                        <Trans id="HomePage.installContent">
                            The system is written in Python, uses Flask as the web framework, and an SQL database as the
                            datastore. Installation is straightforward, providing a lean installation process.
                            <br />
                            <br />
                            You can learn more about the installation process in the{" "}
                            <Link
                                href="https://edumfa.readthedocs.io/en/latest/installation/index.html"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                documentation
                                <Link.Icon />
                            </Link>
                            .
                        </Trans>
                    </p>
                </section>
            </div>
            <Footer pushTesterHref={`/${locale}/push-tester`} />
        </main>
    );
}
