import axios, { AxiosRequestConfig } from "axios";
import { List } from "immutable";
import { isNullOrUndefined } from "util";

import { logger } from "../utils/logger";
import { IBotConfig, ILoginSessionInfo } from "./bot.interface";

// FIXME
export const requestContactJSON = async (config: IBotConfig, loginSession: ILoginSessionInfo, baseUrl: string) => {
    let contactJSON: object = {};
    const url: string = `${baseUrl}/cgi-bin/mmwebwx-bin/webwxgetcontact`;
    const localTime = Number(new Date());
    const data = {
        BaseRequest: {
            Uin: loginSession.wxuin,
            Sid: loginSession.wxsid,
            Skey: loginSession.skey,
            DeviceId: loginSession.deviceId
        }
    };
    const options: AxiosRequestConfig = {
        headers: { "User-Agent": config.userAgent, "Content-Type": "application/json; charset=utf-8" },
        params: {
            lang: "en_GB",
            pass_ticket: loginSession.passTicket,
            r: localTime,
            seq: 0,
            skey: loginSession.skey,
        }
    };
    try {
        logger.debug("params:", options.params);
        const response = await axios.post(url, data, options);
        if (!isNullOrUndefined(response.data)) {
            contactJSON = response.data;
        }
        logger.debug("requestContactJSON:", response.data);
    } catch (e) {
        logger.error("requestContactJSON:", e.reponse.data);
    }
    return contactJSON;
};

export const extractFriends = (contactList: any[]) => {
    //
};

export const extractChatGroups = (contactList: any[]) => {
    //
};

export const extractFriendsAndChatGroups = (contactList: any[]) => {
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
