import { EFontStyle, ELoggingLevel, ILoggingColor } from "../interface";

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
    private loggingColor: ILoggingColor = defaultLoggingColor;
    private level: ELoggingLevel = ELoggingLevel.None;

    constructor(loggingColor?: ILoggingColor) {
        if (loggingColor) {
            this.loggingColor = loggingColor;
        }
    }

    public setLevel(level: ELoggingLevel) {
        this.level = level;
    }

    public log(message: string, level?: ELoggingLevel) {
        if (level === null || level === undefined) { level = this.level; }
        console.log(this.loggingColor[level], message);
    }

    public debug(...args: any[]) {
        console.log(this.loggingColor[ELoggingLevel.Debug], `<-- DEBUG: ${this.compressArguments(args)}`);
    }

    public info(...args: any[]) {
        console.log(this.loggingColor[ELoggingLevel.Info], `<-- INFO: ${this.compressArguments(args)}`);
    }

    public warn(...args: any[]) {
        console.log(this.loggingColor[ELoggingLevel.Warning], `<-- WARN: ${this.compressArguments(args)}`);
    }

    public error(...args: any[]) {
        console.log(this.loggingColor[ELoggingLevel.Error], `<-- ERROR: ${this.compressArguments(args)}`);
    }

    public critical(...args: any[]) {
        console.log(this.loggingColor[ELoggingLevel.Critical], `<-- CRITICAL: ${this.compressArguments(args)}`);
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
