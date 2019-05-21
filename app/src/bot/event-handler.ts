import { Map } from "immutable";
import * as qrcode from "qrcode";
import * as request from "request";

import { logger } from "../utils/logger";
import { EBotEvent, IBotActionResponse, IBotConfig, TBotActionFunction } from "./bot.interface";

const requestUUID: TBotActionFunction = async (config: IBotConfig, event: EBotEvent) => {
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
                resolve({ success: true, data: body.match(/"(.+)"/)[1] } as IBotActionResponse);
            } else {
                reject({ success: false, errorMessage: "" } as IBotActionResponse);
            }
        });
    });
};

const generateQrCode: TBotActionFunction = async (config: IBotConfig, event: EBotEvent, uuid: string) => {
    const content: string = `${config.baseUrl}/l/${uuid}`;
    const qrCodeText: string = await qrcode.toString(content, { type: "terminal" });
    logger.info(`\n${qrCodeText}`);
    logger.info("Waiting authentication...");
    return new Promise<IBotActionResponse>((resolve, reject) => {
        resolve();
    });
};

export const cEventHandler = Map({
    [EBotEvent.LoginStart]: requestUUID,
    [EBotEvent.GenerateQRCode]: generateQrCode
});
