import { Server } from "socket.io";
import db from "./db";
import { WorkspaceUserStatus } from "@prisma/client";
import { updateWorkspaceUser } from "./utils";

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

    if (!alreadyExists) {
      await db.workspaceUser.create({
        data: {
          id: userIdentifier,
          workspaceId: targetWorkspace.id,
        },
      });
    } else {
      await updateWorkspaceUser(userIdentifier, {
        status: WorkspaceUserStatus.ONLINE,
      });
    }

    //events

    /* emit online status to roomId (dashboard client only event) */
    socket.to(roomId).emit("status", {
      id: userIdentifier,
      status: WorkspaceUserStatus.ONLINE,
    });

    /* socket disconnect */
    socket.on("disconnect", async () => {

      await updateWorkspaceUser(userIdentifier, {
        status: WorkspaceUserStatus.OFFLINE,
      });

      socket.to(apiKey).emit("status", {
        id: userIdentifier,
        status: WorkspaceUserStatus.OFFLINE,
      });
    });
    
  } catch (err) {
    return null;
  }
});

io.listen(3002);