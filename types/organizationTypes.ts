export enum OrganizationImplementationPhase {
    EVALUATION = 'Evaluation',
    TESTING = 'Testing',
    PRODUCTION = 'Production',
}

export enum OrganizationTokenType {
    FOUR_EYES = '4Eyes',
    APPLICATION_SPECIFIC_PASSWORD = 'ApplicationSpecificPassword',
    CERTIFICATE = 'Certificate',
    DAY_PASSWORD = 'DayPassword',
    EMAIL = 'Email',
    HOTP = 'HOTP',
    INDEXED_SECRET = 'IndexedSecret',
    MOTP = 'mOTP',
    OCRA = 'OCRA',
    PAPER = 'PPR',
    PUSH = 'Push',
    PASSWORD = 'Password',
    QUESTIONAIRE = 'Questionaire',
    RADUIS = 'Radius',
    REGISTRATION = 'Registration',
    REMOTE = 'Remote',
    SMS = 'SMS',
    SPASS = 'Spass',
    SSH = 'SSH',
    TAN = 'TAN',
    TIQR = 'TiQR',
    TOPT = 'TOTP',
    U2F = 'U2F',
    VASCO = 'VASCO',
    WEB_AUTHN = 'WebAuthn',
    YUBICO = 'Yubico',
    YUBIKEY = 'Yubikey',
}

interface Organization {
    name: string;
    logoSrc: string;
    link: string;
}

export interface Creator extends Organization {}

export interface User extends Organization {
    phase: OrganizationImplementationPhase;
    userCount?: number;
    enrolledUserCount?: number;
    tokenTypes?: OrganizationTokenType[];
}
