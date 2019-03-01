import * as request from "request";

import { CBotConfig, IBotUuidResponse, IBotConfig } from "./interface";


export function getUuid(config: IBotConfig): Promise<IBotUuidResponse> {
    const options = {
        url: `${config.baseUrl}/jslogin`,
        headers: { "User-Agent": config.userAgent },
        qs: {
            "appid": "wx782c26e4c19acffb",
            "fun": "new",
        }
    };
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                resolve({ success: true, uuid: body.match(/"([^"]+)"/g)[0] } as IBotUuidResponse);
            } else {
                reject({ success: false, error } as IBotUuidResponse);
            }
        });
    });
}

export async function login() {
    const response = await getUuid(CBotConfig);
    console.log("***", response);
}

export function generateQrCode() {

}