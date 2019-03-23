import { EFontStyle, ELoggingLevel, ILoggingColor } from "./interface";

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

    public debug() {
        console.log(this.loggingColor[ELoggingLevel.Debug], `<-- DEBUG: ${this.compressArguments(arguments)}`);
    }

    public info() {
        console.log(this.loggingColor[ELoggingLevel.Info], `<-- INFO: ${this.compressArguments(arguments)}`);
    }

    public warn() {
        console.log(this.loggingColor[ELoggingLevel.Warning], `<-- WARN: ${this.compressArguments(arguments)}`);
    }

    public error() {
        console.log(this.loggingColor[ELoggingLevel.Error], `<-- ERROR: ${this.compressArguments(arguments)}`);
    }

    public critical() {
        console.log(this.loggingColor[ELoggingLevel.Critical], `<-- CRITICAL: ${this.compressArguments(arguments)}`);
    }

    private compressArguments(argList: IArguments): string {
        let args: string = "";
        // tslint:disable-next-line: prefer-for-of
        for (let index = 0; index < argList.length; index++) {
            const arg = argList[index];
            if (typeof arg !== "string") {
                args += JSON.stringify(arg);
            } else { args += arg; }
        }
        return args;
    }
}
