"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrowser = exports.getUserPlatform = exports.updateWorkspaceUser = void 0;
const db_1 = __importDefault(require("./db"));
const os_1 = __importDefault(require("os"));
function updateWorkspaceUser(id, newData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const updatedWorkspaceUser = yield db_1.default.workspaceUser.update({
                where: {
                    id,
                },
                data: newData,
            });
            return updatedWorkspaceUser;
        }
        catch (err) {
            throw err;
        }
    });
}
exports.updateWorkspaceUser = updateWorkspaceUser;
function getUserPlatform() {
    const platform = os_1.default.platform();
    let equivalentOS;
    switch (platform) {
        case 'aix':
            equivalentOS = 'AIX';
            break;
        case 'darwin':
            equivalentOS = 'macOS';
            break;
        case 'freebsd':
            equivalentOS = 'FreeBSD';
            break;
        case 'linux':
            equivalentOS = 'Linux';
            break;
        case 'openbsd':
            equivalentOS = 'OpenBSD';
            break;
        case 'sunos':
            equivalentOS = 'SunOS';
            break;
        case 'win32':
            equivalentOS = 'Windows';
            break;
        default:
            equivalentOS = 'Unknown';
    }
    return equivalentOS;
}
exports.getUserPlatform = getUserPlatform;
function getBrowser(userAgent) {
    let browser = "Unknown";
    if (userAgent.indexOf("Chrome") != -1) {
        browser = "Chrome";
    }
    else if (userAgent.indexOf("Firefox") != -1) {
        browser = "Firefox";
    }
    else if (userAgent.indexOf("Safari") != -1 && userAgent.indexOf("Chrome") == -1) {
        browser = "Safari";
    }
    else if (userAgent.indexOf("Edge") != -1) {
        browser = "Edge";
    }
    else if (userAgent.indexOf("Opera") != -1 || userAgent.indexOf("OPR") != -1) {
        browser = "Opera";
    }
    // Add more conditions for other browsers if needed
    return browser;
}
exports.getBrowser = getBrowser;
;
