import { isNullOrUndefined } from "util";
import { IBotConfig } from "./bot.interface";
import { generateQrCode, requestUUID, waitAuth } from "./bot.login";

export class WeChatBot {

    private _config: IBotConfig;

    constructor(config: IBotConfig) {
        this._config = config;
    }

    public async login() {
        const uuid = await requestUUID(this._config);
        const timeout = 3000;
        if (!isNullOrUndefined(uuid) && uuid !== "") {
            await generateQrCode(this._config, uuid);
            await waitAuth(this._config, uuid, timeout);
        }
    }
}
