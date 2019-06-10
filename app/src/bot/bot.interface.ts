export interface IBotConfig {
    readonly baseLoginUrl: string;
    readonly userAgent: string;
}

export enum EBotLoginStatus {
    LoggedIn = "200",
    WaitingAuthentication = "408",
    WaitingConfirmation = "201",
    LoggedOut = "400"
}

export const cBotConfig = {
    baseLoginUrl: "https://login.weixin.qq.com",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/72.0.3626.109 Safari/537.3"
} as IBotConfig;
