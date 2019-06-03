import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as qrcode from "qrcode";
import { parseString } from "xml2js";

import { isNullOrUndefined } from "util";
import { logger, defaultLoggingColor } from "../utils/logger";
import { sleep } from "../utils/utils";
import { EBotLoginStatus, IBotConfig } from "./bot.interface";

export const requestUUID = async (config: IBotConfig) => {
    let uuid: string;
    const url = `${config.baseUrl}/jslogin`;
    const options = {
        headers: { "User-Agent": config.userAgent },
        params: {
            appid: "wx782c26e4c19acffb",
            fun: "new",
        }
    };
    try {
        const response = await axios.get(url, options);
        if (response && response.data && typeof response.data === "string") {
            const regex = /window.QRLogin.code = (\d+); window.QRLogin.uuid = "(\S+?)";/;
            uuid = response.data.match(regex)[2];
        }
    } catch (e) {
        logger.error(e.response);
    }
    return Promise.resolve(uuid);
};

export const generateQrCode = async (config: IBotConfig, uuid: string) => {
    const content: string = `${config.baseUrl}/l/${uuid}`;
    return qrcode.toString(content, { type: "terminal" }).then((qrCodeText: string) => {
        logger.log(`\n${qrCodeText}`);
    });
};

const getLoginStatus = async (config: IBotConfig, uuid: string, timestamp: number) => {
    let loginStatus: EBotLoginStatus;
    let redirectUrl: string;
    const url: string = `${config.baseUrl}/cgi-bin/mmwebwx-bin/login`;
    const options = {
        headers: { "User-Agent": config.userAgent },
        params: {
            loginicon: true,
            uuid,
            tip: "1",
            r: ~timestamp,
            _: timestamp
        }
    };
    try {
        const response = await axios.get(url, options);
        if (response && response.data && response.data !== "") {
            loginStatus = response.data.match(/window.code=(\d+);/)[1];
            redirectUrl = response.data.match(/window.redirect_uri="(\S+)";/)[1];
        }
    } catch (e) {
        logger.error("status:", e.response);
    }
    return Promise.resolve({ loginStatus, redirectUrl });
};

export const waitAuth = async (config: IBotConfig, uuid: string, refreshTime: number) => {
    while (true) {
        const localTime = Number(new Date());
        const { loginStatus, redirectUrl } = await getLoginStatus(config, uuid, localTime);
        await processSessionInfo(config, loginStatus, redirectUrl);
        await sleep(refreshTime);
    }
};

const processSessionInfo = async (config: IBotConfig, loginStatus: EBotLoginStatus, redirectUrl: string) => {
    let infoMessage: string;
    switch (loginStatus) {
        case EBotLoginStatus.WaitingAuthentication: {
            infoMessage = "Waiting authentication";
            break;
        }
        case EBotLoginStatus.WaitingConfirmation: {
            infoMessage = "Waiting login confirmation";
            break;
        }
        case EBotLoginStatus.LoggedIn: {
            if (!isNullOrUndefined(redirectUrl) && redirectUrl !== "") {
                logger.debug("redirect uri:", redirectUrl);
                infoMessage = "Logged in";
                const initUrl = `${redirectUrl.slice(0, redirectUrl.lastIndexOf("/"))}/webwxinit`;
                logger.debug("init url:", initUrl);
                const sessionInfo = await fetchLoginSession(config, redirectUrl);
                logger.debug("session info:", sessionInfo);
            }
            break;
        }
        case EBotLoginStatus.LoggedOut: {
            infoMessage = "Logged out";
            break;
        }
        default: {
            break;
        }
    }
    if (!isNullOrUndefined(infoMessage)) {
        logger.info(infoMessage);
    }
    return Promise.resolve();
};

const fetchLoginSession = async (config: IBotConfig, redirectUrl: string) => {
    const sessionInfo = {
        skey: undefined,
        wxsid: undefined,
        wxuin: undefined,
        passTicket: undefined,
        deviceId: undefined,
        loginTime: undefined
    };
    const options: AxiosRequestConfig = {
        headers: { "User-Agent": config.userAgent },
        maxRedirects: 0
    };
    try {
        const response: AxiosResponse = await axios.get(redirectUrl, options);
        if (response && response.data) {
            parseString(response.data, (xmlData: any) => {
                if (xmlData.error && xmlData.error.ret) {
                    logger.warn("Xml data:" + JSON.stringify(xmlData.error));
                    const returnCode = xmlData.error.ret;
                    if (Array.isArray(returnCode) && returnCode.indexOf("0") > -1) {
                        const deviceId = `e${String(Math.random()).slice(2, 17)}`;
                        const loginTime = (new Date()).getTime();
                        const { skey, wxsid, wxuin, pass_ticket } = xmlData.error;
                        sessionInfo.skey = skey[0];
                        sessionInfo.wxsid = wxsid[0];
                        sessionInfo.wxuin = wxuin[0];
                        sessionInfo.passTicket = pass_ticket[0];
                        sessionInfo.deviceId = deviceId;
                        sessionInfo.loginTime = loginTime;
                    }
                }
            });
        }
    } catch (e) {
        logger.error(e.response);
    }
    return Promise.resolve(Object.assign({}, sessionInfo));
};

const initWeChat = (initUrl: string) => {
    //
};
