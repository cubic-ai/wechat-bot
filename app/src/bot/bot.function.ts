import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as qrcode from "qrcode";
import { parseString } from "xml2js";

import { isNullOrUndefined } from "util";
import { logger } from "../utils/logger";
import { sleep } from "../utils/utils";
import { EBotLoginStatus, IBotConfig } from "./bot.interface";
import { ELoggingLevel } from '../utils/logger.interface';

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
        if (!isNullOrUndefined(e || e.response)) {
            logger.error("requestUUID:", e || e.response);
        }
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
        if (!isNullOrUndefined(e.response)) {
            logger.error("status:", e.response);
        }
    }
    return Promise.resolve({ loginStatus, redirectUrl });
};

export const waitAuth = async (config: IBotConfig, uuid: string, refreshTime: number) => {
    while (true) {
        const localTime = Number(new Date());
        const { loginStatus, redirectUrl } = await getLoginStatus(config, uuid, localTime);
        if (loginStatus === EBotLoginStatus.LoggedIn) {
            if (!isNullOrUndefined(redirectUrl) && redirectUrl !== "") {
                const initUrl = `${redirectUrl.slice(0, redirectUrl.lastIndexOf("/"))}/webwxinit`;
                const loginSession = await processSessionInfo(config, loginStatus, redirectUrl);
                await initWeChat(config, initUrl, loginSession);
            }
            break;
        }
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
                const sessionInfo = await fetchLoginSession(config, redirectUrl);
                logger.debug("session info:", sessionInfo);
                return sessionInfo;
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
};

export interface ILoginSessionInfo {
    skey: string;
    wxsid: string;
    wxuin: string;
    passTicket: string;
    deviceId: string;
    loginTime: number;
}

const fetchLoginSession = async (config: IBotConfig, redirectUrl: string) => {
    const sessionInfo: ILoginSessionInfo = {
        skey: undefined,
        wxsid: undefined,
        wxuin: undefined,
        passTicket: undefined,
        deviceId: undefined,
        loginTime: undefined
    };
    const options = {
        headers: { "User-Agent": config.userAgent },
        maxRedirects: 0
    };
    try {
        await axios.get(redirectUrl, options);
    } catch (e) {
        if (!isNullOrUndefined(e.response.data)) {
            parseString(e.response.data, (xmlError: any, xml) => {
                if (isNullOrUndefined(xmlError) && xml.error && xml.error.ret) {
                    logger.warn("Xml data:" + JSON.stringify(xml.error));
                    const returnCode = xml.error.ret;
                    if (Array.isArray(returnCode) && returnCode.indexOf("0") > -1) {
                        const deviceId = `e${String(Math.random()).slice(2, 17)}`;
                        const loginTime = (new Date()).getTime();
                        const { skey, wxsid, wxuin, pass_ticket } = xml.error;
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
    }
    return Promise.resolve(Object.assign({}, sessionInfo));
};

const initWeChat = async (config: IBotConfig, initUrl: string, sessionInfo: ILoginSessionInfo) => {
    const localTime = Number(new Date());
    const options: AxiosRequestConfig = {
        headers: { "User-Agent": config.userAgent, "Content-Type": "application/json; charset=utf-8" },
        params: {
            r: ~localTime,
            pass_ticket: sessionInfo.passTicket
        }
    };
    const data = {
        BaseRequest: {
            Uin: sessionInfo.wxuin,
            Sid: sessionInfo.wxsid,
            Skey: sessionInfo.skey,
            DeviceId: sessionInfo.deviceId
        }
    };
    try {
        const response = await axios.post(initUrl, data, options);
        logger.file(ELoggingLevel.Debug, "debug.json", response.data);
    } catch (e) {
        if (e.response) {
            logger.error("init:", e.response);
        }
    }
};
