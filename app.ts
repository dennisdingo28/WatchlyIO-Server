import { Server } from "socket.io";
import db from "./db";
import { WorkspaceUserStatus } from "@prisma/client";
import { isValidRoomId, updateWorkspaceUser } from "./utils";

const io = new Server({ cors: { origin: "*" } });

io.on("connection", async (socket) => {
  try {
    console.log("new connection", socket.id, socket.handshake.query);

    const userIdentifier = socket.handshake.query.id as string;
    const apiKey = socket.handshake.query.apiKey as string;

    const roomId = socket.handshake.query.roomId as string;
    const isValidRoom = await isValidRoomId(roomId);

    if (isValidRoom) {
      //dashboard instance
      socket.join(roomId);
    } else {
      //no room was provided - npm client instance
      if (
        !apiKey ||
        apiKey.trim() === "" ||
        !userIdentifier ||
        userIdentifier.trim() === ""
      )
        return;

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

      /* emit online status to roomId (dashboard only event) */
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
    }
  } catch (err) {
    //error handling
    return null;
  }
});

io.listen(3002);
