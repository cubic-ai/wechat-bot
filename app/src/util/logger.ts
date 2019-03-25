import { appendFileSync, appendFile } from "fs";

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
        const msg: string = `-- DEBUG: ${this.compressArguments(args)}`;
        console.log(this._loggingColor[ELoggingLevel.Debug], msg);
        if (this._logToFile) {
            appendFileSync(this._logFilePath, `[${new Date()}] ${msg}`);
        }
    }

    public info(...args: any[]) {
        const msg: string = `-- INFO: ${this.compressArguments(args)}`;
        console.log(this._loggingColor[ELoggingLevel.Info], msg);
        if (this._logToFile) {
            appendFileSync(this._logFilePath, `[${new Date()}] ${msg}`);
        }
    }

    public warn(...args: any[]) {
        const msg: string = `-- WARN: ${this.compressArguments(args)}`;
        console.log(this._loggingColor[ELoggingLevel.Warning], msg);
        if (this._logToFile) {
            appendFileSync(this._logFilePath, `[${new Date()}] ${msg}`);
        }
    }

    public error(...args: any[]) {
        const msg: string = `-- ERROR: ${this.compressArguments(args)}`;
        console.log(this._loggingColor[ELoggingLevel.Error], msg);
        if (this._logToFile) {
            appendFileSync(this._logFilePath, `[${new Date()}] ${msg}`);
        }
    }

    public critical(...args: any[]) {
        const msg: string = `-- CRITICAL: ${this.compressArguments(args)}`;
        console.log(this._loggingColor[ELoggingLevel.Critical], );
        if (this._logToFile) {
            appendFileSync(this._logFilePath, `[${new Date()}] ${msg}`);
        }
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
