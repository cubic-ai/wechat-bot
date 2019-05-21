import { Map } from "immutable";
import * as qrcode from "qrcode";
import * as request from "request";

import { logger } from "../utils/logger";
import { EBotEvent, IBotActionResponse, IBotConfig, TBotActionFunction } from "./bot.interface";

const requestUUID: TBotActionFunction = (config: IBotConfig, event: EBotEvent) => {
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

const generateQrCode: TBotActionFunction = (config: IBotConfig, event: EBotEvent, uuid: string) => {
    const content: string = `${config.baseUrl}/l/${uuid}`;
    return qrcode.toString(content, { type: "terminal" }).then((qrCodeText: string) => {
        logger.log(`\n${qrCodeText}`);
        logger.info("Waiting authentication...");
        return Promise.resolve({ success: true } as IBotActionResponse);
    });
};

export const cEventHandler = Map({
    // No need to handle idle event
    [EBotEvent.Idle]: undefined,
    [EBotEvent.LoginStart]: requestUUID,
    [EBotEvent.GenerateQRCode]: generateQrCode,
    // No need to handle wait event
    [EBotEvent.WaitAuth]: undefined
});
