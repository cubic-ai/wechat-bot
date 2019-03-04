import * as qrcode from "qrcode";
import * as request from "request";

import { CBotConfig, EBotLoginStatus, IBotConfig, IBotUuidResponse } from "./interface";
import { sleep } from "./utils";

export class WechatBot {

    private config: IBotConfig;

    constructor(config: IBotConfig) {
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
        const response = await this.getUuid(CBotConfig);
        if (response.success && response.uuid) {
            const content = `${CBotConfig.baseUrl}/l/${response.uuid}`;
            const asciiQrCode = await qrcode.toString(content, { type: "terminal" });
            console.log(`${asciiQrCode}\n*** Waiting user authentication`);

            let loginSucceed: boolean = false;
            while (!loginSucceed) {
                const loginStatus = await this.getBotLoginStatus(CBotConfig, response.uuid);
                console.log("*** checking status");
                switch (loginStatus) {
                    case EBotLoginStatus.loggedIn: {
                        loginSucceed = true;
                        break;
                    }
                    case EBotLoginStatus.waitingAuthentication: {
                        break;
                    }
                    case EBotLoginStatus.loggedOut: {
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
    public async getBotLoginStatus(config: IBotConfig, uuid: string): Promise<EBotLoginStatus> {
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
                        case EBotLoginStatus.loggedIn: {
                            console.log("*** logged in");
                            break;
                        }
                        case EBotLoginStatus.waitingAuthentication: {
                            console.log("*** waiting auth");
                            break;
                        }
                        case EBotLoginStatus.watingConfirmation: {
                            console.log("*** wating confirm");
                            break;
                        }
                        case EBotLoginStatus.loggedOut: {
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
                resolve(EBotLoginStatus.waitingAuthentication);
            });
        });
    }

    public pageRedirect() {
        // TODO
    }
}
