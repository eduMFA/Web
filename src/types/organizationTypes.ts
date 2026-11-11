import type {organizationTokenTypes} from "./organizationTokenTypes";

export enum OrganizationImplementationPhase {
    EVALUATION = "Evaluation",
    TESTING = "Testing",
    PRODUCTION = "Production",
}

export type OrganizationTokenType = (typeof organizationTokenTypes)[number];

interface Organization {
    name: string;
    logoSrc: string;
    link: string;
}

export interface Creator extends Organization {}

export interface User extends Omit<Organization, "link"> {
    url?: string;
    link?: string;
    updatedAt: string;
    phase: OrganizationImplementationPhase;
    userCount?: number;
    enrolledUserCount?: number;
    tokenTypes?: OrganizationTokenType[];
}
