import { EOperationSystem } from "../library/interface";

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export function detectOperatingSystem(): EOperationSystem {
    let os = EOperationSystem.UnKnown;
    switch (process.platform) {
        case "aix":
        case "freebsd":
        case "openbsd":
        case "sunos":
            os = EOperationSystem.Unix;
            break;
        case "android":
        case "linux":
            os = EOperationSystem.Linux;
            break;
        case "darwin":
            os = EOperationSystem.MacOs;
            break;
        case "win32":
            os = EOperationSystem.Windows;
            break;
        default:
            os = EOperationSystem.UnKnown;
            break;
    }
    return os;
}
