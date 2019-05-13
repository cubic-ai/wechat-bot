import { EventEmitter } from "events";
import { Map } from "immutable";
import { EBotEvent } from "./interface";
import defaultListeners from "./listener";

export type TBotListeners = Map<string, (...args: any[]) => any>;

export class CubicBotEmitter extends EventEmitter {

    private _listeners: TBotListeners;

    constructor(listeners?: TBotListeners) {
        super();
        if (listeners) { this.registerListensers(listeners); } else {
            this.registerListensers(defaultListeners);
        }
    }

    /**
     * Register event listeners
     *
     * @param {TBotListeners} listeners
     * @memberof BotEmitter
     */
    public registerListensers(listeners: TBotListeners) {
        this._listeners = listeners;

        if (this._listeners) {
            this._listeners.keySeq().forEach((event: EBotEvent) => {
                const callback = this._listeners.get(event);
                this.on(event, callback);
            });
        }
    }
}
