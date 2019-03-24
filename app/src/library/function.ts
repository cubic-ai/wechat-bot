import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import qrcode from "qrcode";
import { parseString } from "xml2js";

import { logger } from "../util/logger";
import { botConfig as config, LoginInfo } from "./interface";

export async function login() {
    const uuid = await requestUUID();
    const asciiQR = await generateQR(uuid);
    logger.info(`\n${asciiQR}`);

    await checkLoginStatus(uuid);
    // TODO: pass content
    await processLoginInfo("");
    await initWechat();
}

/**
 * Start the handshaking process and grab the UUID returned
 *
 * @export
 * @returns {Promise<string>}
 */
export async function requestUUID(): Promise<string> {
    const url: string = `${config.baseUrl}/jslogin`;
    const options = {
        headers: { "User-Agent": config.userAgent },
        params: {
            appid: "wx782c26e4c19acffb",
            fun: "new",
        }
    };

    const response = await axios.get(url, options);
    let result: string;

    if (response && response.data && typeof response.data === "string") {
        const regex = /window.QRLogin.code = (\d+); window.QRLogin.uuid = "(\S+?)";/;
        const returnCode = response.data.match(regex)[1];
        const uuid = response.data.match(regex)[2];
        if (returnCode === "200") {
            logger.info("UUID:", uuid);
            result = uuid;
        } else {
            logger.error("Error fetching UUID with code:", returnCode);
        }
    } else {
        logger.error("Error fetching UUID");
    }
    return Promise.resolve(result);
}

async function generateQR(uuid: string): Promise<void> {
    const content = `${config.baseUrl}/l/${uuid}`;
    const asciiQR = await qrcode.toString(content, { type: "terminal" });
    return Promise.resolve(asciiQR);
}

async function checkLoginStatus(uuid: string): Promise<void> {
    // TODO:
    const localTime = Number(new Date());
    const url: string = `${config.baseUrl}/cgi-bin/mmwebwx-bin/login`;
    const options = {
        headers: { "User-Agent": config.userAgent },
        params: {
            loginicon: "true",
            uuid,
            tip: "1",
            r: ~localTime,
            _: localTime
        }
    };
    const response: AxiosResponse = await axios.get(url, options);
    // TODO: process response data
    return Promise.resolve();
}

async function processLoginInfo(content: string): Promise<void> {
    const pattern = /window.redirect_uri="(\S+)";/;
    const redirectUrl: string = content.match(pattern)[1];
    let initUrl: string = redirectUrl.slice(0, redirectUrl.lastIndexOf("/"));
    initUrl = `${initUrl}/webwxinit`;
    LoginInfo.wechatInitUrl = initUrl;

    const options: AxiosRequestConfig = {
        headers: { "User-Agent": this.config.userAgent },
        maxRedirects: 0
    };

    const response: AxiosResponse = await axios.get(redirectUrl, options);
    if (response.data) {
        // TODO: check if the reponse data is the one needed (xml)
        parseString(response.data, (xmlData: any) => {
            if (xmlData.error && xmlData.error.ret) {
                logger.warn("Xml data:" + JSON.stringify(xmlData.error));
                const returnCode = xmlData.error.ret;
                if (Array.isArray(returnCode) && returnCode.indexOf("0") > -1) {
                    const deviceId = `e${String(Math.random()).slice(2, 17)}`;
                    const loginTime = (new Date()).getTime();
                    const { skey, wxsid, wxuin, pass_ticket } = xmlData.error;
                    LoginInfo.skey = skey[0];
                    LoginInfo.wxsid = wxsid[0];
                    LoginInfo.wxuin = wxuin[0];
                    LoginInfo.passTicket = pass_ticket[0];
                    LoginInfo.deviceId = deviceId;
                    LoginInfo.loginTime = loginTime;
                }
            }
        });
    }
    return Promise.resolve();
}

async function initWechat(): Promise<void> {
    const localTime = Number(new Date());
    const url: string = `${LoginInfo.wechatInitUrl}/webwxinit`;
    const options: AxiosRequestConfig = {
        headers: { "User-Agent": config.userAgent, "Content-Type": "application/json; charset=utf-8" },
        params: { r: ~localTime, pass_ticket: LoginInfo.passTicket, skey: LoginInfo.skey },
        data: LoginInfo.BaseRequest
    };

    const reponse: AxiosResponse = await axios.post(url, options);
    // TODO: process response data
    return Promise.resolve();
}

async function extractCurrentUser() {
    // TODO:
}

async function extractContactList() {
    // TODO:
}
