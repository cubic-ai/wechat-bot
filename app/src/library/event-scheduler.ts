import { CubicBotEmitter } from "./emitter";
import { EBotEvent } from "./interface";

// Event scheduler is responsible to determine what the next event should be.

export class EventScheduler {

    private _eventEmitter: CubicBotEmitter;

    public registerEventEmitter(eventEmitter: CubicBotEmitter) {
        this._eventEmitter = eventEmitter;
    }

    public scheduleNextEvent(previousEvent: EBotEvent): EBotEvent {
        let nextEvent: EBotEvent;
        switch (previousEvent) {
            case EBotEvent.LoginStart:
                nextEvent = EBotEvent.GenerateQRCode;
                break;
        }
        return nextEvent;
    }
}
