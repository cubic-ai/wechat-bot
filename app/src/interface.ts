interface IBotConfig {
    readonly baseUrl: string;
    readonly userAgent: string;
};

export const CBotConfig = {
    baseUrl:  "https://login.weixin.qq.com",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.3"
} as IBotConfig;

export interface IBotUuidResponse {
    success: boolean;
    uuid?: string;
    error?: any;
}