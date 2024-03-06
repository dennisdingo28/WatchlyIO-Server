import { Server } from "socket.io";
import db from "./db";
import { WorkspaceUser, WorkspaceUserStatus } from "@prisma/client";
import { getUserPlatform, updateWorkspaceUser } from "./utils";

const io = new Server({ cors: { origin: "*" } });

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
  const country = socket.handshake.query.country as string;
  const countryCode = socket.handshake.query.countryCode as string;

  try {
    
    if (
      !apiKey ||
      apiKey.trim() === "" ||
      !userIdentifier ||
      userIdentifier.trim() === "" ||
      !country ||
      country.trim() === "" ||
      !countryCode ||
      countryCode.trim() === ""
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
          country,
          countryCode,
        },
      });
    } else {
      workspaceUser = await updateWorkspaceUser(userIdentifier, {
        status: WorkspaceUserStatus.ONLINE,
        joinedAt: new Date(Date.now()),
      });
    }

    
    /* emit online status to roomId (dashboard client only event) */
    io.of("/dashboard").to(roomId).emit("status", workspaceUser);

    //events
    socket.on("identifier-deprecated", async  (data: {id: string})=>{
      await db.workspaceUser.delete({
        where:{
          id: data.id,
        },
      });
    });

    /* socket disconnect */
    socket.on("disconnect", async () => {

      const updatedWorkspaceUser = await updateWorkspaceUser(userIdentifier, {
        status: WorkspaceUserStatus.OFFLINE,
        disconnectedAt: new Date(Date.now()),
      });

      io.of("/dashboard").to(roomId).emit("status", updatedWorkspaceUser);
    });
    
  } catch (err) {
    console.log("err", err);
    
    return null;
  }
});

io.listen(3002);