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
            this._logger.info(`${asciiQrCode}\n*** Waiting authentication`);

            let loginSucceed: boolean = false;
            while (!loginSucceed) {
                const [loginStatus, responseBody] = await this.botLoginStatus(botConfig, response.uuid);
                switch (loginStatus) {
                    case EBotLoginStatus.LoggedIn: {
                        this._logger.info("*** Login success\n*** Redirecting starts");
                        loginSucceed = true;
                        await this.redirect(responseBody);
                        break;
                    }
                    case EBotLoginStatus.WaitingAuthentication: {
                        this._logger.info("*** Waiting auth");
                        break;
                    }
                    case EBotLoginStatus.WaitingConfirmation: {
                        this._logger.info("*** Waiting confirmation");
                        break;
                    }
                    case EBotLoginStatus.LoggedOut: {
                        this._logger.info("*** Bye");
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
    public async botLoginStatus(config: IBotConfig, uuid: string): Promise<[EBotLoginStatus, string]> {
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
                    const loginStatus = body.match(/window.code=(\d+)/)[1];
                    if (body === "400") {
                        this._logger.log("*** wating user action");
                    }
                    resolve([loginStatus, body]);
                }
                resolve([EBotLoginStatus.WaitingAuthentication, body]);
            });
        });
    }

    public redirect(content: string) {
        const pattern = /window.redirect_uri="(\S+)";/;
        const url = content.match(pattern)[1];
        const options = {
            url,
            headers: { "User-Agent": this.config.userAgent },
            followRedirect: false
        };

        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                this._logger.info(`*** ${body}`);
                /*
                ["wx2.qq.com", "wx8.qq.com", "qq.com", "web2.wechat.com", "wechat.com"].forEach(() => {
                    const [fileUrl, syncUrl] = [
                        `https://file.${url}/cgi-bin/mmwebwx-bin`,
                        `https://webpush.${url}/cgi-bin/mmwebwx-bin`
                    ];
                    // deviceid
                    const deviceId = `e${String(Math.random()).slice(2, 17)}`;
                    const loginTime = (new Date()).getTime();
                    const request = {
                        skey: "",
                        wxsid: "",
                        wxuin: "",
                        pass_ticket: ""
                    };
                });
                */

                resolve();
            });
        });
    }
}
