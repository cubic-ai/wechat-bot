import * as qrcode from "qrcode";
import * as request from "request";
import { parseString } from "xml2js";

import { botConfig, EBotLoginStatus, IBotConfig, IBotUuidResponse, LoginInfo } from "./interface";
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
                if (!error && response && response.statusCode === 200) {
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
            this._logger.info(`\n${asciiQrCode}`);
            this._logger.info("Waiting authentication...");

            let loginSucceed: boolean = false;
            while (!loginSucceed) {
                const [loginStatus, responseBody] = await this.botLoginStatus(botConfig, response.uuid);
                this._logger.debug("Login status returned:" + loginStatus);
                switch (loginStatus) {
                    case EBotLoginStatus.LoggedIn: {
                        this._logger.info("Redirecting starts...");
                        loginSucceed = true;
                        await this.processRedirectInfo(responseBody);
                        await this.wechatInit(this.config);
                        break;
                    }
                    case EBotLoginStatus.WaitingAuthentication: {
                        this._logger.info("Waiting auth...");
                        break;
                    }
                    case EBotLoginStatus.WaitingConfirmation: {
                        this._logger.info("Waiting confirmation...");
                        break;
                    }
                    case EBotLoginStatus.LoggedOut: {
                        this._logger.info("Bye~");
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
                if (response && response.statusCode === 200) {
                    const loginStatus = body.match(/window.code=(\d+)/)[1];
                    if (body === "400") {
                        this._logger.info("Wating user action");
                    }
                    resolve([loginStatus, body]);
                }
                resolve([EBotLoginStatus.WaitingAuthentication, body]);
            });
        });
    }

    public processRedirectInfo(content: string) {
        const pattern = /window.redirect_uri="(\S+)";/;
        let url: string = content.match(pattern)[1];
        url = url.slice(0, url.lastIndexOf("/"));

        const options = {
            url,
            headers: { "User-Agent": this.config.userAgent },
            followRedirect: false
        };

        LoginInfo.redirectUrl = url;

        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {

                if (response && response.statusCode === 301) {

                    this._logger.debug("Redirect: ", JSON.stringify(response));

                    parseString(body, (xmlError: any, xml: any) => {
                        this._logger.warn("Xml data:" + JSON.stringify(xml.error));
                        if (xmlError === null && xml.error && xml.error.ret) {
                            const returnCode = xml.error.ret;
                            if (Array.isArray(returnCode) && returnCode.indexOf("0") > -1) {
                                const deviceId = `e${String(Math.random()).slice(2, 17)}`;
                                const loginTime = (new Date()).getTime();
                                const { skey, wxsid, wxuin, pass_ticket } = xml.error;
                                LoginInfo.skey = skey;
                                LoginInfo.wxsid = wxsid;
                                LoginInfo.wxuin = wxuin;
                                LoginInfo.passTicket = pass_ticket;
                                LoginInfo.deviceId = deviceId;
                                LoginInfo.loginTime = loginTime;
                            }

                        }
                    });
                }
                resolve();
            });
        });
    }

    public async wechatInit(config: IBotConfig): Promise<void> {
        const localTime = Number(new Date());
        const options = {
            url: `${LoginInfo.redirectUrl}/webwxinit`,
            headers: { "User-Agent": config.userAgent, "Content-Type": "application/json; charset=utf-8" },
            qs: { r: ~localTime, pass_ticket: LoginInfo.passTicket },
            json: LoginInfo.BaseRequest
        };

        this._logger.debug("Init options:", options);

        return new Promise((reject, resolve) => {
            request.post(options, (error, response, body) => {
                this._logger.debug(response);
                resolve();
            });
        });
    }
}
