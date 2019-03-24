import { Map } from "immutable";

import { TBotListeners } from "./emitter";
import { requestUUID } from "./function";
import { EBotEvent } from "./interface";

const defaultListeners: TBotListeners = Map({
    [EBotEvent.LoginStart]: requestUUID,
    [EBotEvent.Quit]: () => {
        //
    }
});

export default defaultListeners;
