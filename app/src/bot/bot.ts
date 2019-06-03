import { isNullOrUndefined } from "util";
import { generateQrCode, requestUUID, waitAuth } from "./bot.function";
import { IBotConfig } from "./bot.interface";

export class WeChatBot {

    private _config: IBotConfig;

    constructor(config: IBotConfig) {
        this._config = config;
    }

    public start() {
        this._login();
    }

    private async _login() {
        const uuid = await requestUUID(this._config);
        const timeout = 3000;
        if (!isNullOrUndefined(uuid) && uuid !== "") {
            await generateQrCode(this._config, uuid);
            await waitAuth(this._config, uuid, timeout);
        }
    }
}
