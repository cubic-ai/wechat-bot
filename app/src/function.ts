import * as request from "request";
import * as qrcode from "qrcode";

import { CBotConfig, IBotUuidResponse, IBotConfig, EBotLoginStatus } from "./interface";


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
                resolve({ success: true, uuid: body.match(/"(.+)"/)[1] } as IBotUuidResponse);
            } else {
                reject({ success: false, error } as IBotUuidResponse);
            }
        });
    });
}

export async function login() {
    const response = await getUuid(CBotConfig);
    if (response.success && response.uuid) {
        const content = `${CBotConfig.baseUrl}/l/${response.uuid}`;
        // await qrcode.toFile("./login.png", content, { type: "png" });
        const asciiQrCode = await qrcode.toString(content, { type: "terminal" });
        console.log(`${asciiQrCode}\n*** Waiting user authentication`);

        let loginSucceed: boolean = false;
        while (!loginSucceed) {
            let loginStatus = await getBotLoginStatus(CBotConfig, response.uuid);
            console.log("*** checking status")
            switch (loginStatus) {
                case EBotLoginStatus.loggedIn: {
                    loginSucceed = true;
                    break;
                }
                case EBotLoginStatus.waitingAuthentication: {
                    break;
                }
                case EBotLoginStatus.loggedOut: {
                    break;
                }
                default: {
                    break;
                }
            }
            await sleep(2000);
        }
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export async function getBotLoginStatus(config: IBotConfig, uuid: string): Promise<EBotLoginStatus> {
    const localTime = Number(new Date());

    const options = {
        url: `${config.baseUrl}/cgi-bin/mmwebwx-bin/login`,
        headers: { "User-Agent": config.userAgent },
        qs: {
            "loginicon": "true",
            "uuid": uuid,
            "tip": "1",
            "r": ~localTime,
            "_": localTime
        }
    };
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (response.statusCode === 200) {
                console.log("*** body:", body);
                const loginStatus = body.match(/window.code=(\d+)/)[1];
                console.log("*** status:", loginStatus);
                if (body === "400") {
                    console.log("*** wating user action");
                }

                switch (loginStatus) {
                    case EBotLoginStatus.loggedIn: {
                        console.log("*** logged in");
                        break;
                    }
                    case EBotLoginStatus.waitingAuthentication: {
                        console.log("*** waiting auth");
                        break;
                    }
                    case EBotLoginStatus.watingConfirmation: {
                        console.log("*** wating confirm");
                        break;
                    }
                    case EBotLoginStatus.loggedOut: {
                        console.log("*** logged out")
                        break;
                    }
                    default: {
                        console.log("*** default");
                        break;
                    }
                }
            }
            // TODO:
            resolve(EBotLoginStatus.waitingAuthentication);
        });
    });
}