import { Map } from "immutable";
import { BehaviorSubject, Observable } from "rxjs";
import { isNullOrUndefined } from "util";

import { logger } from "../utils/logger";
import { EBotEvent, IBotConfig, IBotEventWithPayload, TBotActionFunction } from "./bot.interface";
import { cEventHandler } from "./event-handler";

export class WeChatBot {
    private _config: IBotConfig;
    private _event$: Observable<IBotEventWithPayload>;
    private _eventSubject: BehaviorSubject<IBotEventWithPayload>;
    private _eventHandler: Map<string, TBotActionFunction>;

    constructor(config: IBotConfig) {
        this._config = config;
        this._eventHandler = cEventHandler;
        this._eventSubject = new BehaviorSubject({ event: EBotEvent.Idle });
        this._event$ = this._eventSubject.asObservable();
        this.handleEvent();
    }

    public start(): void {
        this._eventSubject.next({ event: EBotEvent.LoginStart });
        // Switch to "old" stdin mode to keep main thread running without blocking it
        process.stdin.resume();
    }

    private handleEvent() {
        this._event$.subscribe(({ event, payload }) => {
            if (!isNullOrUndefined(event)) {
                if (Map.isMap(this._eventHandler) && this._eventHandler.keySeq().includes(event)) {
                    const processEvent = this._eventHandler.get(event);
                    if (!isNullOrUndefined(processEvent)) {
                        processEvent(this._config, event, payload)
                            .then(response => {
                                if (response.success) {
                                    logger.debug("response data:", response.data);
                                    this.emitNextEvent(event, response.data);
                                } else {
                                    logger.error(response.errorMessage);
                                }
                            })
                            .catch((error) => {
                                logger.error(error);
                            });
                    }
                } else {
                    logger.error("No handler available for event:", event);
                }
            }
        });
    }

    private emitNextEvent(currentEvent: EBotEvent, payload: any): void {
        let nextEvent: EBotEvent;
        switch (currentEvent) {
            case EBotEvent.LoginStart:
                nextEvent = EBotEvent.GenerateQRCode;
                break;
            case EBotEvent.GenerateQRCode:
                nextEvent = EBotEvent.WaitAuth;
                break;
            default:
                break;
        }
        this._eventSubject.next({
            event: nextEvent,
            payload
        } as IBotEventWithPayload);
    }

}
