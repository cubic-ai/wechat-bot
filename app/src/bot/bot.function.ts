import axios, { AxiosRequestConfig } from "axios";
import { List, Map } from "immutable";
import * as qrcode from "qrcode";
import { parseString } from "xml2js";

import { isNullOrUndefined } from "util";
import { logger } from "../utils/logger";
import { sleep } from "../utils/utils";
import { EBotLoginStatus, IBotConfig } from "./bot.interface";

export const requestUUID = async (config: IBotConfig) => {
    let uuid: string;
    const url = `${config.baseLoginUrl}/jslogin`;
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
    const content: string = `${config.baseLoginUrl}/l/${uuid}`;
    return qrcode.toString(content, { type: "terminal" }).then((qrCodeText: string) => {
        logger.log(`\n${qrCodeText}`);
    });
};

const getLoginStatus = async (config: IBotConfig, uuid: string, timestamp: number) => {
    let loginStatus: EBotLoginStatus;
    let redirectUrl: string;
    const url: string = `${config.baseLoginUrl}/cgi-bin/mmwebwx-bin/login`;
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
            logger.error("getLoginStatus:", e.response);
        }
    }
    return { loginStatus, redirectUrl };
};

export const waitAuth = async (config: IBotConfig, uuid: string, refreshTime: number) => {
    while (true) {
        const localTime = Number(new Date());
        const { loginStatus, redirectUrl } = await getLoginStatus(config, uuid, localTime);
        if (loginStatus === EBotLoginStatus.LoggedIn) {
            if (!isNullOrUndefined(redirectUrl) && redirectUrl !== "") {
                const initUrl = `${redirectUrl.slice(0, redirectUrl.lastIndexOf("/"))}/webwxinit`;
                const loginSession = await processSessionInfo(config, loginStatus, redirectUrl);
                const initResponse = await initWeChat(config, initUrl, loginSession);
                const initData = extractInitInfo(initResponse);
                const baseUrl = `https://${initUrl.split("/")[2]}`;
                await initNotificationStream(config, loginSession, initData.get("userId"), baseUrl);
                await checkSyncStatus(config, loginSession, initData.get("syncKey"), baseUrl);
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
                infoMessage = "Logged in";
                const sessionInfo = await fetchLoginSession(config, redirectUrl);
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
        logger.info("processSessionInfo:", infoMessage);
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
    let response: any;
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
        response = await axios.post(initUrl, data, options);
    } catch (e) {
        if (e.response) {
            logger.error("initWeChat:", e.response);
        }
    }
    if (!isNullOrUndefined(response)) {
        return response.data;
    }
};

const extractInitInfo = (initData: any) => {
    let info = Map<string, any>();
    if (!isNullOrUndefined(initData) && !isNullOrUndefined(initData.User)) {
        const userInfo = initData.User;
        let syncKey: string;
        if (!isNullOrUndefined(initData.SyncKey)) {
            if (Array.isArray(initData.SyncKey.List)) {
                syncKey = initData.SyncKey.List.map(({ Key, Val }) => `${Key}_${Val}`).join("|");
            }
        }
        info = info.withMutations(mutable => {
            mutable.set("userId", userInfo.UserName);
            mutable.set("inviteStartCount", initData.InviteStartCount);
            mutable.set("syncKey", syncKey);
            mutable.set("nickName", userInfo.NickName);
        });
    }
    if (!isNullOrUndefined(initData) && Array.isArray(initData.ContactList)) {
        const { chatGroups, friends } = extractChatGroupsAndFriends(initData.ContactList);
    }
    return info;
};

const getContactList = (baseUrl: string) => {
    const url: string = `${baseUrl}/cgi-bin/mmwebwx-bin/webwxgetcontact`;

};

const extractChatGroupsAndFriends = (contactList: any[]) => {
    let chatGroups = List();
    let friends = List();
    if (Array.isArray(contactList)) {
        contactList.forEach(contact => {
            if (!isNullOrUndefined(contact)) {
                if (typeof contact.UserName === "string") {
                    if (contact.UserName.startsWith("@@")) {
                        chatGroups = chatGroups.push(contact);
                    } else if (contact.UserName.startsWith("@")) {
                        if (!isNullOrUndefined(contact.Sex) && contact.Sex !== 0) {
                            friends = friends.push(contact);
                        }
                    }
                }
            }
        });
    }
    return { chatGroups, friends };
};

const initNotificationStream = async (
    config: IBotConfig,
    sessionInfo: ILoginSessionInfo,
    userId: string,
    baseUrl: string
) => {
    let messageId: string;
    const url: string =
        `${baseUrl}/cgi-bin/mmwebwx-bin/webwxstatusnotify`;
    const localTime = Number(new Date());
    const options: AxiosRequestConfig = {
        headers: { "User-Agent": config.userAgent, "Content-Type": "application/json; charset=utf-8" },
        params: {
            lang: "en_GB",
            pass_ticket: sessionInfo.passTicket
        }
    };
    const data = {
        BaseRequest: {
            Uin: Number(sessionInfo.wxuin),
            Sid: sessionInfo.wxsid,
            Skey: sessionInfo.skey,
            DeviceId: sessionInfo.deviceId
        },
        Code: 3,
        FromUserName: userId,
        ToUserName: userId,
        ClientMsgId: localTime
    };
    try {
        const response = await axios.post(url, data, options);
        if (typeof response.data === "object") {
            const baseResponse = response.data.BaseResponse;
            if (!isNullOrUndefined(baseResponse)) {
                if (baseResponse.Ret === 0) {
                    logger.info("initNotificationStream: notification stream initialised");
                    messageId = response.data.MsgID;
                } else if (baseResponse.ErrMsg) {
                    logger.error("initNotificationStream:", baseResponse.ErrMsg);
                }
            }
        }
    } catch (e) {
        logger.error("initNotificationStream:", e.response);
    }
    if (isNullOrUndefined(messageId)) {
        logger.error("initNotificationStream: error occurred when fetching message ID");
    } else {
        return messageId;
    }
};

const checkSyncStatus = async (
    config: IBotConfig,
    sessionInfo: ILoginSessionInfo,
    syncKey: string,
    baseUrl: string
) => {
    const url = `${baseUrl}/cgi-bin/mmwebwx-bin/synccheck`;
    const localTime = Number(new Date());
    const options: AxiosRequestConfig = {
        params: {
            r: localTime,
            skey: sessionInfo.skey,
            sid: sessionInfo.wxsid,
            uin: sessionInfo.wxuin,
            deviceid: sessionInfo.deviceId,
            synckey: syncKey,
            _: localTime
        },
        headers: { "User-Agent": config.userAgent, "Content-Type": "application/json; charset=utf-8" }
    };
    try {
        const response = await axios.get(url, options);
        logger.debug("checkSyncStatus:", response.data);
    } catch (e) {
        logger.error("checkSyncStatus:", e.response);
    }
};
