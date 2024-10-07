import {OrganizationImplementationPhase, User} from "@/types/organizationTypes";
import React from "react";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/modal";
import {Card} from "@nextui-org/card";
import Image from "next/image";
import {Link} from "@nextui-org/link";
import {Tooltip} from "@nextui-org/tooltip";
import {Chip} from "@nextui-org/chip";

interface OrganizationBoxProps {
    user: User
}

export const OrganizationBox: React.FC<OrganizationBoxProps> = ({user}) => {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const nf = new Intl.NumberFormat('en', {notation: 'compact', maximumFractionDigits: 2});
    const rtf = new Intl.RelativeTimeFormat('en', {numeric: 'auto'});

    const updatedDaysDiff = Math.round((new Date(user.updatedAt).getTime() - new Date().getTime()) / 1000 / 60 / 60 / 24);

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
                            <ModalHeader className="flex flex-col gap-1">
                                <Link isExternal showAnchorIcon href={user.link} color="foreground">{user.name}</Link>
                            </ModalHeader>
                            <ModalBody>
                                {(user.userCount != undefined || user.enrolledUserCount != undefined) && (
                                    <div className="flex items-center mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                             strokeWidth="1.5" stroke="currentColor" className="size-5 mr-2">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                                        </svg>
                                        {(user.userCount != undefined && user.enrolledUserCount != undefined) && (
                                            <p className=" text-gray-700">
                                                Approx. Enrolled Users: <span
                                                className="font-bold">{nf.format(user.enrolledUserCount)} / {nf.format(user.userCount)} (~{Math.round(user.enrolledUserCount / user.userCount * 100)}%)</span>
                                            </p>
                                        )}
                                        {(user.userCount == undefined && user.enrolledUserCount != undefined) && (
                                            <p className=" text-gray-700">
                                                Approx. Enrolled Users: <span
                                                className="font-bold">{nf.format(user.enrolledUserCount)}</span>
                                            </p>
                                        )}
                                        {(user.userCount != undefined && user.enrolledUserCount == undefined) && (
                                            <p className=" text-gray-700">
                                                Approx. Users: <span
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
                                    <p className=" text-gray-700 pr-2">Implementation Phase: </p>
                                    <Tooltip showArrow content="Evaluation">
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${user.phase === OrganizationImplementationPhase.EVALUATION ? 'bg-blue-500 text-white' : 'bg-gray-300'} mr-2 group relative`}>
                                            E
                                        </div>
                                    </Tooltip>
                                    <Tooltip showArrow content="Testing">
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${user.phase === OrganizationImplementationPhase.TESTING ? 'bg-yellow-500 text-black' : 'bg-gray-300'} mr-2 group relative`}>
                                            T
                                        </div>
                                    </Tooltip>
                                    <Tooltip showArrow content="Production">
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${user.phase === OrganizationImplementationPhase.PRODUCTION ? 'bg-green-500 text-white' : 'bg-gray-300'} mr-2 group relative`}>
                                            P
                                        </div>
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
                                            <p className="text-gray-700">Token Types:</p>
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {user.tokenTypes.map((type, index) => (
                                                <Chip key={index}>{type}</Chip>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <div className="text-xs text-gray-500">
                                    Last updated {rtf.format(updatedDaysDiff, 'day')}
                                </div>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}