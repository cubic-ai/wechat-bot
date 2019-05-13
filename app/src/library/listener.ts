import { Map } from "immutable";

import { TBotListeners } from "./emitter";
import { requestUUID } from "./function";
import { EBotEvent } from "./interface";

const defaultListeners: TBotListeners = Map({
    [EBotEvent.LoginStart]: async () => {
        await requestUUID();
        // scheduleNextEvent(EBotEvent.LoginStart);
    },
    [EBotEvent.GenerateQRCode]: () => {
        // TODO:
    },
    [EBotEvent.Quit]: () => {
        // TODO:
    }
});

export default defaultListeners;
