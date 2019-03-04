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

    public debug(message: string) {
        console.log(this.loggingColor[ELoggingLevel.Debug], message);
    }

    public info(message: string) {
        console.log(this.loggingColor[ELoggingLevel.Info], message);
    }

    public warning(message: string) {
        console.log(this.loggingColor[ELoggingLevel.Warning], message);
    }

    public error(message: string) {
        console.log(this.loggingColor[ELoggingLevel.Error], message);
    }

    public critical(message: string) {
        console.log(this.loggingColor[ELoggingLevel.Critical], message);
    }
}
