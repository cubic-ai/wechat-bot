import * as qrcode from "qrcode";
import * as request from "request";
import { parseString } from "xml2js";

import { sleep } from "../util";
import { logger } from "../util/logger";
import { CubicBotEmitter } from "./emitter";
import { botConfig, EBotEvent, EBotLoginStatus, IBotConfig, IBotUuidResponse, LoginInfo } from "./interface";

export class CubicBot {

    private config: IBotConfig;
    private _emitter: CubicBotEmitter;
    private _running: boolean = false;

    constructor(
        config: IBotConfig
    ) {
        this.config = config;
        this._emitter = new CubicBotEmitter();
    }

    /**
     * Start the handshaking with wechat and grab the UUID returned
     *
     * @param {IBotConfig} config
     * @returns {Promise<IBotUuidResponse>}
     * @memberof WechatBot
     */
    public async getUUID(config: IBotConfig): Promise<IBotUuidResponse> {
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
        const response = await this.getUUID(botConfig);
        if (response.success && response.uuid) {
            const content = `${botConfig.baseUrl}/l/${response.uuid}`;
            const asciiQrCode = await qrcode.toString(content, { type: "terminal" });
            logger.info(`\n${asciiQrCode}`);
            logger.info("Waiting authentication...");

            let loginSucceed: boolean = false;
            while (!loginSucceed) {
                const [loginStatus, responseBody] = await this.botLoginStatus(botConfig, response.uuid);
                logger.debug("Login status returned:" + loginStatus);
                switch (loginStatus) {
                    case EBotLoginStatus.LoggedIn: {
                        logger.info("Redirecting starts...");
                        loginSucceed = true;
                        await this.processLoginInfo(responseBody);
                        await this.wechatInit(this.config);
                        break;
                    }
                    case EBotLoginStatus.WaitingAuthentication: {
                        logger.info("Waiting auth...");
                        break;
                    }
                    case EBotLoginStatus.WaitingConfirmation: {
                        logger.info("Waiting confirmation...");
                        break;
                    }
                    case EBotLoginStatus.LoggedOut: {
                        logger.info("Bye~");
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
                        logger.info("Wating user action");
                    }
                    resolve([loginStatus, body]);
                }
                resolve([EBotLoginStatus.WaitingAuthentication, body]);
            });
        });
    }

    public processLoginInfo(content: string) {
        const pattern = /window.redirect_uri="(\S+)";/;
        const redirectUrl: string = content.match(pattern)[1];

        const options = {
            url: redirectUrl,
            headers: { "User-Agent": this.config.userAgent },
            followRedirect: false
        };

        const url = redirectUrl.slice(0, redirectUrl.lastIndexOf("/"));
        LoginInfo.wechatInitUrl = `${url}/webwxinit`;
        logger.debug("Redirect URL:", LoginInfo.wechatInitUrl);

        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {

                if (error) { reject(error); }
                // if (response && response.statusCode === 301) {
                if (response && response.statusCode) {

                    parseString(body, (xmlError: any, xml: any) => {
                        logger.debug("Xml error:", xmlError);
                        if (xml.error && xml.error.ret) {
                            logger.warn("Xml data:" + JSON.stringify(xml.error));
                            const returnCode = xml.error.ret;
                            if (Array.isArray(returnCode) && returnCode.indexOf("0") > -1) {
                                const deviceId = `e${String(Math.random()).slice(2, 17)}`;
                                const loginTime = (new Date()).getTime();
                                const { skey, wxsid, wxuin, pass_ticket } = xml.error;
                                LoginInfo.skey = skey[0];
                                LoginInfo.wxsid = wxsid[0];
                                LoginInfo.wxuin = wxuin[0];
                                LoginInfo.passTicket = pass_ticket[0];
                                LoginInfo.deviceId = deviceId;
                                LoginInfo.loginTime = loginTime;
                            }
                            resolve();
                        }
                    });
                }
            });
        });
    }

    public async wechatInit(config: IBotConfig): Promise<void> {
        const localTime = Number(new Date());
        const options = {
            url: `${LoginInfo.wechatInitUrl}/webwxinit`,
            headers: { "User-Agent": config.userAgent, "Content-Type": "application/json; charset=utf-8" },
            qs: { r: ~localTime, pass_ticket: LoginInfo.passTicket, skey: LoginInfo.skey },
            json: {
                BaseRequest: {
                    Uin: LoginInfo.wxuin,
                    Sid: LoginInfo.wxsid,
                    Skey: LoginInfo.skey,
                    DeviceID: LoginInfo.deviceId
                }
            }
        };

        logger.debug("Init options:", options);

        return new Promise((resolve, reject) => {
            request.post(options, (error, response, body) => {
                logger.debug(response);
                resolve();
            });
        });
    }

    // -------------------------------------------

    public async run() {
        this._running = true;
        logger.welcome();
        this._emitter.emit(EBotEvent.LoginStart);
        // Switch to "old" stdin mode to keep main thread running without blocking it
        process.stdin.resume();
    }

}
