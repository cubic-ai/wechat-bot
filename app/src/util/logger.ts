import { appendFileSync } from "fs";

import { EFontStyle, ELoggingLevel, ILoggingColor } from "../library/interface";

export const defaultLoggingColor = {
    [ELoggingLevel.None]: EFontStyle.Reset,
    [ELoggingLevel.Debug]: EFontStyle.FgMagenta,
    [ELoggingLevel.Info]: EFontStyle.FgCyan,
    [ELoggingLevel.Warning]: EFontStyle.FgYellow,
    [ELoggingLevel.Error]: EFontStyle.FgRed,
    [ELoggingLevel.Critical]: EFontStyle.BgRed
};

/**
 * Utility class that is to display messages to indicate errors or show informations to
 * a user
 *
 * @export
 * @class Logger
 */
export class Logger {
    private _loggingColor: ILoggingColor = defaultLoggingColor;
    private _level: ELoggingLevel = ELoggingLevel.None;
    private _logToFile: boolean = false;
    private readonly _logFilePath: string = "bot.log";

    constructor(loggingColor?: ILoggingColor) {
        if (loggingColor) {
            this._loggingColor = loggingColor;
        }
    }

    public setLevel(level: ELoggingLevel) {
        this._level = level;
    }

    public log(message: string, level?: ELoggingLevel) {
        if (level === null || level === undefined) { level = this._level; }
        console.log(this._loggingColor[level], message);
    }

    public welcome() {
        const msg: string = "*** SATRT ***";
        this.info(msg);
        if (this._logToFile) {
            appendFileSync(this._logFilePath, `[${new Date()}] ${msg}`);
        }
    }

    public debug(...args: any[]) {
        console.log(this._loggingColor[ELoggingLevel.Debug], `-- DEBUG: ${this.compressArguments(args)}`);
        if (this._logToFile) {
            //
        }
    }

    public info(...args: any[]) {
        console.log(this._loggingColor[ELoggingLevel.Info], `-- INFO: ${this.compressArguments(args)}`);
        if (this._logToFile) {

        }
    }

    public warn(...args: any[]) {
        console.log(this._loggingColor[ELoggingLevel.Warning], `-- WARN: ${this.compressArguments(args)}`);
        if (this._logToFile) {
            
        }
    }

    public error(...args: any[]) {
        console.log(this._loggingColor[ELoggingLevel.Error], `-- ERROR: ${this.compressArguments(args)}`);
    }

    public critical(...args: any[]) {
        console.log(this._loggingColor[ELoggingLevel.Critical], `-- CRITICAL: ${this.compressArguments(args)}`);
    }

    private compressArguments(argList: any[]): string {
        let args: string = "";
        for (const arg of argList) {
            if (typeof arg === "string") { args += ` ${arg}`; } else {
                args += ` ${JSON.stringify(arg)}`;
            }
        }
        return args;
    }
}

export const logger = new Logger();
