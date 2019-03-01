import * as request from "request";

import { CBotConfig, IBotUuidResponse } from "./interface";


export function getUuid(): Promise<IBotUuidResponse> {
    const options = {
        url: `${CBotConfig.baseUrl}/jslogin`,
        headers: {
            "User-Agent": CBotConfig.userAgent
        },
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
    const uuid = await getUuid();
    console.log("***", uuid);
}

export function generateQrCode() {

}