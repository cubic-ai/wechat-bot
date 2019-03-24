import axios from "axios";

import { logger } from "../util/logger";
import { botConfig as config } from "./interface";

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

async function generateQR(): Promise<void> {

}