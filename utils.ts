import { WorkspaceUser, WorkspaceUserStatus } from "@prisma/client";
import db from "./db"
import os from "os";

type WorkspaceUserData = {
    joinedAt?: Date,
    disconnectedAt?: Date | null,
    status?: WorkspaceUserStatus,
    currentPath?: string
}
export async function updateWorkspaceUser(id: string, newData: WorkspaceUserData): Promise<WorkspaceUser>{
    try{
        const updatedWorkspaceUser = await db.workspaceUser.update({
            where:{
                id,
            },
            data: newData,
        });
        
        return updatedWorkspaceUser;
    }catch(err){
        throw err;
    }
}

export function getUserPlatform(){
    const platform = os.platform();
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

export function getBrowser(userAgent: string){
  let browser = "Unknown";

  if (userAgent.indexOf("Chrome") != -1) {
      browser = "Chrome";
  } else if (userAgent.indexOf("Firefox") != -1) {
      browser = "Firefox";
  } else if (userAgent.indexOf("Safari") != -1 && userAgent.indexOf("Chrome") == -1) {
      browser = "Safari";
  } else if (userAgent.indexOf("Edge") != -1) {
      browser = "Edge";
  } else if (userAgent.indexOf("Opera") != -1 || userAgent.indexOf("OPR") != -1) {
      browser = "Opera";
  }
  // Add more conditions for other browsers if needed

  return browser;
};