export enum EBotEvent {
    Idle = "Idle",
    LoginStart = "LoginStart",
    GenerateQRCode = "GenerateQRCode",
    WaitAuth = "WaitAuth",
    Quit = "Quit"
}

export interface IBotConfig {
    readonly baseUrl: string;
    readonly userAgent: string;
}

export interface IBotActionResponseData {
    type: string;
    value: any;
}

export interface IBotEventWithPayload {
    event: EBotEvent;
    payload?: IBotActionResponseData;
}

export interface IBotActionResponse {
    success: boolean;
    data: any;
    errorMessage?: string;
}

export enum EBotLoginStatus {
    LoggedIn = "200",
    WaitingAuthentication = "408",
    WaitingConfirmation = "201",
    LoggedOut = "400"
}

export const cBotConfig = {
    baseUrl: "https://login.weixin.qq.com",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/72.0.3626.109 Safari/537.3"
} as IBotConfig;

export type TBotActionFunction = (config: IBotConfig, event: EBotEvent, payload?: any) => Promise<IBotActionResponse>;
