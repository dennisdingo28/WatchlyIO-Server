import { Server } from "socket.io";
import db from "./db";
import { WorkspaceUserStatus } from "@prisma/client";

const io = new Server({ cors:{origin:"*"}});

io.on("connection", async (socket) => {
    console.log("new connection", socket.id, socket.handshake.query);
    const identifier = socket.handshake.query.id as string;
    const apiKey = socket.handshake.query.apiKey as string;
    socket.join(apiKey);

    if(!apiKey || apiKey.trim()==="") return;

    try{
        const targetWorkspace = await db.workspace.findUnique({
            where:{
                apiKey,
            },
        });

        const alreadyExists = await db.workspaceUser.findUnique({
            where:{
                id:identifier,
            },
        });
        
        if(!alreadyExists){
            await db.workspaceUser.create({
                data:{
                    id: identifier,
                    workspaceId:targetWorkspace!.id,
                },
            });

        }else{
            await db.workspaceUser.update({
                where:{
                    id: identifier,
                },
                data:{
                    status: WorkspaceUserStatus.ONLINE,
                },
            });

        }
        socket.to(apiKey).emit("status",{id: identifier, status:WorkspaceUserStatus.ONLINE});

    }catch(err){

    }

    socket.on("disconnect",async ()=>{
        console.log("discoonect");
    
        try{
         
            await db.workspaceUser.update({
                where:{
                    id: identifier,
                },
                data:{
                    status: WorkspaceUserStatus.OFFLINE,
                },
            });
            socket.to(apiKey).emit("status",{id: identifier, status:WorkspaceUserStatus.OFFLINE});

        }catch(err){
    
        }
    })
    
});

io.listen(3002);