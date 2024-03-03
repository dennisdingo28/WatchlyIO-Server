import { WorkspaceUserStatus } from "@prisma/client";
import db from "./db"

type WorkspaceUserData = {
    joinedAt?: Date,
    disconnectedAt?: Date,
    status?: WorkspaceUserStatus
}
export async function updateWorkspaceUser(id: string, newData: WorkspaceUserData){
    try{
        await db.workspaceUser.update({
            where:{
                id,
            },
            data: newData,
        });
    }catch(err){
        throw err;
    }
}