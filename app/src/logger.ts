import { EFontStyle } from "./interface";

export enum ELoggingLevel {
    none,
    debug,
    info,
    warning,
    error,
    critical
}

export interface ILoggingColor {
    [ELoggingLevel.none]: string;
    [ELoggingLevel.debug]: string;
    [ELoggingLevel.info]: string;
    [ELoggingLevel.warning]: string;
    [ELoggingLevel.error]: string;
    [ELoggingLevel.critical]: string;
}

export const CLoggingColor = {
    [ELoggingLevel.none]: EFontStyle.Reset,
    [ELoggingLevel.debug]: EFontStyle.FgMagenta,
    [ELoggingLevel.info]: EFontStyle.FgCyan,
    [ELoggingLevel.warning]: EFontStyle.FgYellow,
    [ELoggingLevel.error]: EFontStyle.FgRed,
    [ELoggingLevel.critical]: EFontStyle.BgRed
};

/**
 * Utility class that is to display messages to indicate errors or show informations to
 * a user
 *
 * @export
 * @class Logger
 */
export class Logger {
    private loggingColor: ILoggingColor = CLoggingColor;
    private level: ELoggingLevel = ELoggingLevel.none;

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

    public debug(message: string) {
        console.log(this.loggingColor[ELoggingLevel.debug], message);
    }

    public info(message: string) {
        console.log(this.loggingColor[ELoggingLevel.info], message);
    }

    public warning(message: string) {
        console.log(this.loggingColor[ELoggingLevel.warning], message);
    }

    public error(message: string) {
        console.log(this.loggingColor[ELoggingLevel.error], message);
    }

    public critical(message: string) {
        console.log(this.loggingColor[ELoggingLevel.critical], message);
    }
}
