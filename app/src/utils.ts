import { EOperationSystem } from "./interface";

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export function detectOperatingSystem(): EOperationSystem {
    let os = EOperationSystem.unKnown;
    switch (process.platform) {
        case "aix":
        case "freebsd":
        case "openbsd":
        case "sunos":
            os = EOperationSystem.unix;
            break;
        case "android":
        case "linux":
            os = EOperationSystem.linux;
            break;
        case "darwin":
            os = EOperationSystem.macOs;
            break;
        case "win32":
            os = EOperationSystem.windows;
            break;
        default:
            os = EOperationSystem.unKnown;
            break;
    }
    return os;
}
