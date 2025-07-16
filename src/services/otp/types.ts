
export enum Portal {
    AMEX = "amex",
    AMAZON = "amazon",
    GYFTR_AMEX_REWARDS_MULTIPLIER = "amex_rewards_multiplier",
}

export enum OTPType {
    CARD_TRANSACTION = "transaction",
    ACCOUNT_LOGIN = "login",
}

export interface OTPResult {
    otp: string;
    message: string;
    timestamp: string;
    portal: Portal;
    otpType: OTPType;
}
