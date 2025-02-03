'use client'

import React, {ReactNode} from "react";
import organizationData from "@/data/users.json";
import {User} from "@/types/organizationTypes";
import {Link} from "@heroui/link";
import {ScrollShadow} from "@heroui/scroll-shadow";
import {OrganizationBox} from "@/components/organizationBox";
import {NavigationBar} from "@/components/navigationBar";
import {useTranslations} from "next-intl";
import RichText from "@/components/richText";
import {Footer} from "@/components/footer";

const organizations = organizationData as User[];

export default function Home() {
    const t = useTranslations('HomePage');

    return (
        <main className="flex flex-col min-h-screen bg-gray-100">

            <NavigationBar/>

            <div className="container mx-auto px-4 py-8 flex-grow">
                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">{t('aboutTitle')}</h2>
                    <p className="text-gray-700">
                        <RichText>
                            {(tags) => t.rich('aboutContent', tags)}
                        </RichText>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">{t('featuresTitle')}</h2>
                    <div className="text-gray-700">
                        <RichText>
                            {(tags) => t.rich('featuresContent',
                                {
                                    ...tags,
                                    minPyVersion: '3.9',
                                    maxPyVersion: '3.13'
                                }
                            )}
                        </RichText>
                    </div>

                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">{t('reasonTitle')}</h2>
                    <p className="text-gray-700">
                        <RichText>
                            {(tags) => t.rich('reasonContent', tags)}
                        </RichText>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">{t('supportTitle')}</h2>
                    <div className="text-gray-700">
                        <RichText>
                            {(tags) => t.rich('supportContent',
                                {
                                    ...tags,
                                    userMailingListLink: (content: ReactNode) =>
                                        <Link
                                            href="https://www.listserv.dfn.de/sympa/info/edumfa-users"
                                            isExternal
                                            showAnchorIcon
                                        >
                                            {content}
                                        </Link>
                                }
                            )}
                        </RichText>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">{t('orgTitle')}</h2>
                    <ScrollShadow className="max-h-96">
                        <div
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4">
                            {organizations.map((org, index) => (
                                <OrganizationBox user={org} key={index}/>
                            ))}
                        </div>
                    </ScrollShadow>
                    <p className="text-gray-500 mt-2 text-sm italic">
                        {t.rich('orgFooter', {
                            addOrgLink: (content: ReactNode) =>
                                <Link
                                    href="https://github.com/eduMFA/Web/issues/new?labels=organization&title=%5BOrg%5D+&template=manage_organization.yml"
                                    isExternal
                                    showAnchorIcon
                                >
                                    {content}
                                </Link>
                        })}
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">{t('installTitle')}</h2>
                    <p className="text-gray-700">
                        <RichText>
                            {(tags) => t.rich('installContent',
                                {
                                    ...tags,
                                    documentationLink: (content: ReactNode) =>
                                        <Link
                                            href="https://edumfa.readthedocs.io/en/latest/installation/index.html"
                                            isExternal
                                            showAnchorIcon
                                        >
                                            {content}
                                        </Link>
                                }
                            )}
                        </RichText>
                    </p>
                </section>
            </div>

            <Footer/>
        </main>
    );
}