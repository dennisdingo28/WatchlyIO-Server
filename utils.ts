import { WorkspaceUserStatus } from "@prisma/client";
import db from "./db"

type WorkspaceUserData = {
    joinedAt?: Date,
    disconnectedAt?: Date,
    status?: WorkspaceUserStatus
}
export async function updateWorkspaceUser(id: string, newData: WorkspaceUserData){
    await db.workspaceUser.update({
        where:{
            id,
        },
        data: newData,
    });
}


export async function isValidRoomId(roomId: string | undefined){
    try{
        if(!roomId) return false;
        
        const workspace = await db.workspace.findFirst({
            where:{
                roomId,
            },
        });

        return !!workspace;
    }catch(err){
        return false;
    }
}