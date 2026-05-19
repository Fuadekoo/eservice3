export declare function getTwoFactorAppIssuer(): string;
export declare function getTwoFactorDefaults(): {
    digits: number;
    periodSeconds: number;
    window: number;
};
export declare function generateTwoFactorSecret(): string;
export declare function formatTwoFactorSecret(secret: string): string;
export declare function buildTwoFactorOtpAuthUri(options: {
    secret: string;
    accountName: string;
    issuer?: string;
}): string;
export declare function verifyTwoFactorCode(secret: string, code: string, options?: {
    timestamp?: number;
    window?: number;
}): boolean;
export declare function encryptTwoFactorSecret(secret: string): string;
export declare function decryptTwoFactorSecret(value: string): string;
export declare function createTwoFactorLoginChallengeId(): string;
export declare function getTwoFactorLoginChallengeIdentifier(userId: string): string;
export declare function parseTwoFactorLoginChallengeUserId(identifier: string): string | null;
//# sourceMappingURL=two-factor.d.ts.map