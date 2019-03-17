import * as qrcode from "qrcode";
import * as request from "request";

import { botConfig, EBotLoginStatus, IBotConfig, IBotUuidResponse } from "./interface";
import { Logger } from "./logger";
import { sleep } from "./utils";

export class WechatBot {

    private config: IBotConfig;

    constructor(
        private _logger: Logger,
        config: IBotConfig
    ) {
        this.config = config;
    }

    /**
     * Start the handshaking with wechat and grab the UUID returned
     *
     * @param {IBotConfig} config
     * @returns {Promise<IBotUuidResponse>}
     * @memberof WechatBot
     */
    public async getUuid(config: IBotConfig): Promise<IBotUuidResponse> {
        const options = {
            headers: { "User-Agent": config.userAgent },
            url: `${config.baseUrl}/jslogin`,
            qs: {
                appid: "wx782c26e4c19acffb",
                fun: "new",
            }
        };
        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    resolve({ success: true, uuid: body.match(/"(.+)"/)[1] } as IBotUuidResponse);
                } else {
                    reject({ success: false, error } as IBotUuidResponse);
                }
            });
        });
    }

    /**
     * Present a QR code and allow a user to login
     *
     * @memberof WechatBot
     */
    public async login() {
        const response = await this.getUuid(botConfig);
        if (response.success && response.uuid) {
            const content = `${botConfig.baseUrl}/l/${response.uuid}`;
            const asciiQrCode = await qrcode.toString(content, { type: "terminal" });
            console.log(`${asciiQrCode}\n*** Waiting user authentication`);

            let loginSucceed: boolean = false;
            while (!loginSucceed) {
                const loginStatus = await this.botLoginStatus(botConfig, response.uuid);
                console.log("*** checking status");
                switch (loginStatus) {
                    case EBotLoginStatus.LoggedIn: {
                        loginSucceed = true;
                        break;
                    }
                    case EBotLoginStatus.WaitingAuthentication: {
                        break;
                    }
                    case EBotLoginStatus.LoggedOut: {
                        break;
                    }
                    default: {
                        break;
                    }
                }
                await sleep(2000);
            }
        }
    }

    /**
     * Check the current status of the login proess
     *
     * @param {IBotConfig} config
     * @param {string} uuid
     * @returns {Promise<EBotLoginStatus>}
     * @memberof WechatBot
     */
    public async botLoginStatus(config: IBotConfig, uuid: string): Promise<EBotLoginStatus> {
        const localTime = Number(new Date());

        const options = {
            url: `${config.baseUrl}/cgi-bin/mmwebwx-bin/login`,
            headers: { "User-Agent": config.userAgent },
            qs: {
                loginicon: "true",
                uuid,
                tip: "1",
                r: ~localTime,
                _: localTime
            }
        };
        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (response.statusCode === 200) {
                    console.log("*** body:", body);
                    const loginStatus = body.match(/window.code=(\d+)/)[1];
                    console.log("*** status:", loginStatus);
                    if (body === "400") {
                        console.log("*** wating user action");
                    }

                    switch (loginStatus) {
                        case EBotLoginStatus.LoggedIn: {
                            console.log("*** logged in");
                            break;
                        }
                        case EBotLoginStatus.WaitingAuthentication: {
                            console.log("*** waiting auth");
                            break;
                        }
                        case EBotLoginStatus.WatingConfirmation: {
                            console.log("*** wating confirm");
                            break;
                        }
                        case EBotLoginStatus.LoggedOut: {
                            console.log("*** logged out");
                            break;
                        }
                        default: {
                            console.log("*** default");
                            break;
                        }
                    }
                }
                // TODO:
                resolve(EBotLoginStatus.WaitingAuthentication);
            });
        });
    }

    public getLoginInfo() {
        // TODO
    }

    public redirect(content: string) {
        console.log("*** content:", content);
        const pattern = /window.redirect_uri="(\S+)";/;
        const url = content.search(pattern);

        const urlMap = {
            "wx2.qq.com": ["file.wx2.qq.com", "webpush.wx2.qq.com"],
            "wx8.qq.com": ["file.wx8.qq.com", "webpush.wx8.qq.com"],
            "qq.com": ["file.wx.qq.com", "webpush.wx.qq.com"],
            "web2.wechat.com": ["file.web2.wechat.com", "webpush.web2.wechat.com"],
            "wechat.com": ["file.web.wechat.com", "webpush.web.wechat.com"]
        };

        ["wx2.qq.com", "wx8.qq.com", "qq.com", "web2.wechat.com", "wechat.com"].forEach(url => {
            const [fileUrl, syncUrl] = [
                `https://file.${url}/cgi-bin/mmwebwx-bin`,
                `https://webpush.${url}/cgi-bin/mmwebwx-bin`
            ];
            // TODO:
            // deviceid
            // logintime
            // base request
        });

        const options = {
            headers: { "User-Agent": this.config.userAgent },
            url: `${this.config.baseUrl}/jslogin`,
            qs: {
                appid: "wx782c26e4c19acffb",
                fun: "new",
            }
        };
    }
}
