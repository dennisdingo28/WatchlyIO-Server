import Express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import db from "./db";
import { WorkspaceUser, WorkspaceUserStatus } from "@prisma/client";
import { getUserPlatform, updateWorkspaceUser } from "./utils";
import {lookup} from "geoip-lite"

const app = Express();
const httpServer = createServer(app);

const io = new Server(httpServer,{ cors: { origin: "*" } });

//watchly dashboard
const dashboardNamespace = io.of("/dashboard");

//watchly npm client
const workspaceUserNamespace = io.of("/workspaceUser");

dashboardNamespace.on("connection", async (socket) => {

  try{

    const roomId = socket.handshake.query.roomId as string;
    const workspace = await db.workspace.findUnique({
      where:{
        roomId,
      },
    });
  
    if(!workspace) throw new Error("Invalid room id");

    socket.join(workspace.roomId);

  }catch(err){
    return null;
  }
});


workspaceUserNamespace.on("connection", async (socket) => {
  
  const userIdentifier = socket.handshake.query.id as string;
  const apiKey = socket.handshake.query.apiKey as string;

  try {
    if (
      !apiKey ||
      apiKey.trim() === "" ||
      !userIdentifier ||
      userIdentifier.trim() === ""
    )
      throw new Error("Invalid fields.");

    const targetWorkspace = await db.workspace.findUnique({
      where: {
        apiKey,
      },
    });
    if (!targetWorkspace) throw new Error("No workspace was found.");

    const roomId = targetWorkspace.roomId;
    socket.join(roomId);

    //update user status
    const alreadyExists = await db.workspaceUser.findUnique({
      where: {
        id: userIdentifier,
      },
    });

    let workspaceUser: WorkspaceUser;

    if (!alreadyExists) {
      workspaceUser =  await db.workspaceUser.create({
        data: {
          id: userIdentifier,
          workspaceId: targetWorkspace.id,
          platform:getUserPlatform(),
        },
      });
    } else {
      workspaceUser = await updateWorkspaceUser(userIdentifier, {
        status: WorkspaceUserStatus.ONLINE,
        joinedAt: new Date(Date.now()),
      });
    }

    //events
    
    /* emit online status to roomId (dashboard client only event) */
    io.of("/dashboard").to(roomId).emit("status", workspaceUser);

    /* socket disconnect */
    socket.on("disconnect", async () => {

      const updatedWorkspaceUser = await updateWorkspaceUser(userIdentifier, {
        status: WorkspaceUserStatus.OFFLINE,
        disconnectedAt: new Date(Date.now()),
      });

      io.of("/dashboard").to(roomId).emit("status", updatedWorkspaceUser);
    });
    
  } catch (err) {
    return null;
  }
});

app.get("/",(req,res)=>{
  res.json("re");
})

httpServer.listen(3002);