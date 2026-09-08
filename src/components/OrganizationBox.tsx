import {OrganizationImplementationPhase, User} from "@/types/organizationTypes";
import React from "react";
import {Chip, Link, Modal, Tooltip} from "@heroui/react";
import Image from "next/image";
import {useLocale, useTranslations} from "next-intl";

interface OrganizationBoxProps {
    user: User
}

export const OrganizationBox: React.FC<OrganizationBoxProps> = ({user}) => {
    const t = useTranslations('OrganizationBox');
    const locale = useLocale();

    const nf = new Intl.NumberFormat(locale, {notation: 'compact', maximumFractionDigits: 2});
    const rtf = new Intl.RelativeTimeFormat(locale, {numeric: 'auto'});


    const updatedAt = new Date(user.updatedAt).getTime();
    const updatedDaysDiff = Number.isFinite(updatedAt)
        ? Math.round((updatedAt - Date.now()) / 1000 / 60 / 60 / 24)
        : null;

    return (
        <Modal>
                <Modal.Trigger className="relative h-32 w-full cursor-pointer rounded-xl border-none bg-surface shadow-sm">
                    <Image
                        src={user.logoSrc}
                        alt={user.name}
                        fill
                        className="p-2 object-contain"
                    />
                </Modal.Trigger>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog>
                            <Modal.CloseTrigger />
                            <Modal.Header>
                                <Modal.Heading>
                                    <Link href={user.link} target="_blank" rel="noopener noreferrer">
                                        {user.name}<Link.Icon />
                                    </Link>
                                </Modal.Heading>
                            </Modal.Header>
                            <Modal.Body>
                                {(user.userCount != undefined || user.enrolledUserCount != undefined) && (
                                    <div className="flex items-center mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                             strokeWidth="1.5" stroke="currentColor" className="size-5 mr-2">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                                        </svg>
                                        {(user.userCount != undefined && user.enrolledUserCount != undefined) && (
                                            <p className=" text-gray-700">
                                                {t('enrolledCount')} <span
                                                className="font-bold">{nf.format(user.enrolledUserCount)} / {nf.format(user.userCount)} (~{Math.round(user.enrolledUserCount / user.userCount * 100)}%)</span>
                                            </p>
                                        )}
                                        {(user.userCount == undefined && user.enrolledUserCount != undefined) && (
                                            <p className=" text-gray-700">
                                                {t('enrolledCount')} <span
                                                className="font-bold">{nf.format(user.enrolledUserCount)}</span>
                                            </p>
                                        )}
                                        {(user.userCount != undefined && user.enrolledUserCount == undefined) && (
                                            <p className=" text-gray-700">
                                                {t('userCount')} <span
                                                className="font-bold">{nf.format(user.userCount)}</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                         strokeWidth="1.5" stroke="currentColor" className="size-5 mr-2">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
                                    </svg>
                                    <p className=" text-gray-700 pr-2">{t('implementationPhase')} </p>
                                    <Tooltip>
                                        <Tooltip.Trigger className="mr-2">
                                        <span
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${user.phase === OrganizationImplementationPhase.EVALUATION ? 'bg-blue-500 text-white' : 'bg-gray-300'} mr-2 group relative`}>
                                            {t('phaseEval').charAt(0).toUpperCase()}
                                        </span>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content showArrow><Tooltip.Arrow />{t('phaseEval')}</Tooltip.Content>
                                    </Tooltip>
                                    <Tooltip>
                                        <Tooltip.Trigger className="mr-2">
                                        <span
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${user.phase === OrganizationImplementationPhase.TESTING ? 'bg-yellow-500 text-black' : 'bg-gray-300'} mr-2 group relative`}>
                                            {t('phaseTest').charAt(0).toUpperCase()}
                                        </span>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content showArrow><Tooltip.Arrow />{t('phaseTest')}</Tooltip.Content>
                                    </Tooltip>
                                    <Tooltip>
                                        <Tooltip.Trigger className="mr-2">
                                        <span
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${user.phase === OrganizationImplementationPhase.PRODUCTION ? 'bg-green-500 text-white' : 'bg-gray-300'} mr-2 group relative`}>
                                            {t('phaseProd').charAt(0).toUpperCase()}
                                        </span>
                                        </Tooltip.Trigger>
                                        <Tooltip.Content showArrow><Tooltip.Arrow />{t('phaseProd')}</Tooltip.Content>
                                    </Tooltip>
                                </div>
                                {user.tokenTypes && user.tokenTypes.length > 0 && (
                                    <>
                                        <div className="flex items-center mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                                 strokeWidth="1.5" stroke="currentColor" className="size-6 mr-2">
                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                      d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"/>
                                            </svg>
                                            <p className="text-gray-700">{t('tokenTypes')}</p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {user.tokenTypes.map((type, index) => (
                                                <Chip key={index}>{type}</Chip>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </Modal.Body>
                            {updatedDaysDiff !== null && (
                                <Modal.Footer>
                                    <div className="text-xs text-gray-500">
                                        {t('lastUpdated')} {rtf.format(updatedDaysDiff, 'day')}
                                    </div>
                                </Modal.Footer>
                            )}
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
        </Modal>
    );
}
