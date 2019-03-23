export interface IBotConfig {
    readonly baseUrl: string;
    readonly userAgent: string;
}

export const botConfig = {
    baseUrl: "https://login.weixin.qq.com",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/72.0.3626.109 Safari/537.3"
} as IBotConfig;

export interface IBotUuidResponse {
    success: boolean;
    uuid?: string;
    error?: any;
}

export enum EBotLoginStatus {
    LoggedIn = "200",
    WaitingAuthentication = "408",
    WaitingConfirmation = "201",
    LoggedOut = "400"
}

export enum EOperationSystem {
    Windows = "Windows",
    MacOs = "MacOS",
    Unix = "Unix",
    Linux = "Linux",
    UnKnown = "Unknown"
}

export enum EFontStyle {
    Reset = "\x1b[0m%s\x1b[0m",
    Bright = "\x1b[1m%s\x1b[0m",
    Dim = "\x1b[2m%s\x1b[0m",
    Underscore = "\x1b[4m%s\x1b[0m",
    Blink = "\x1b[5m%s\x1b[0m",
    Reverse = "\x1b[7m%s\x1b[0m",
    Hidden = "\x1b[8m%s\x1b[0m",
    FgBlack = "\x1b[30m%s\x1b[0m",
    FgRed = "\x1b[31m%s\x1b[0m",
    FgGreen = "\x1b[32m%s\x1b[0m",
    FgYellow = "\x1b[33m%s\x1b[0m",
    FgBlue = "\x1b[34m%s\x1b[0m",
    FgMagenta = "\x1b[35m%s\x1b[0m",
    FgCyan = "\x1b[36m%s\x1b[0m",
    FgWhite = "\x1b[37m%s\x1b[0m",
    BgBlack = "\x1b[40m%s\x1b[0m",
    BgRed = "\x1b[41m%s\x1b[0m",
    BgGreen = "\x1b[42m%s\x1b[0m",
    BgYellow = "\x1b[43m%s\x1b[0m",
    BgBlue = "\x1b[44m%s\x1b[0m",
    BgMagenta = "\x1b[45m%s\x1b[0m",
    BgCyan = "\x1b[46m%s\x1b[0m",
    BgWhite = "\x1b[47m%s\x1b[0m"
}

export enum ELoggingLevel {
    None,
    Debug,
    Info,
    Warning,
    Error,
    Critical
}

export interface ILoggingColor {
    [ELoggingLevel.None]: string;
    [ELoggingLevel.Debug]: string;
    [ELoggingLevel.Info]: string;
    [ELoggingLevel.Warning]: string;
    [ELoggingLevel.Error]: string;
    [ELoggingLevel.Critical]: string;
}

export enum EUrl {
    WeChatInit
}

export class LoginInfo {

    public static redirectUrl: string;
    public static deviceId: string;
    public static loginTime: number;
    public static passTicket: string;
    public static skey: string;
    public static wxsid: string;
    public static wxuin: string;

    private static readonly lookupKeys = ["wx2.qq.com", "wx8.qq.com", "wx.qq.com", "web2.wechat.com", "web.wechat.com"];

    public static get handshakeUrls(): { fileUrl: string, syncUrl: string } {
        const urls = this.lookupKeys
            .filter((baseUrl: string) => this.redirectUrl && this.redirectUrl.indexOf(baseUrl) > -1);

        if (Array.isArray(urls) && urls.length > 0) {
            return {
                fileUrl: `https://file.${urls[0]}/cgi-bin/mmwebwx-bin`,
                syncUrl: `https://webpush.${urls[0]}/cgi-bin/mmwebwx-bin`
            };
        }
    }

    public static get BaseRequest(): object {
        return {
            BaseRequest: {
                Uin: this.wxuin,
                Sid: this.wxsid,
                Skey: this.skey,
                DeviceID: this.deviceId
            }
        };
    }
}
