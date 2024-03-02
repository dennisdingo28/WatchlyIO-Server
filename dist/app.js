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
const socket_io_1 = require("socket.io");
const db_1 = __importDefault(require("./db"));
const client_1 = require("@prisma/client");
const utils_1 = require("./utils");
const io = new socket_io_1.Server({ cors: { origin: "*" } });
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("new connection", socket.id, socket.handshake.query);
        const userIdentifier = socket.handshake.query.id;
        const apiKey = socket.handshake.query.apiKey;
        const roomId = socket.handshake.query.roomId;
        const isValidRoom = yield (0, utils_1.isValidRoomId)(roomId);
        if (isValidRoom) {
            //dashboard instance
            socket.join(roomId);
        }
        else {
            //no room was provided - npm client instance
            if (!apiKey ||
                apiKey.trim() === "" ||
                !userIdentifier ||
                userIdentifier.trim() === "")
                return;
            const targetWorkspace = yield db_1.default.workspace.findUnique({
                where: {
                    apiKey,
                },
            });
            if (!targetWorkspace)
                throw new Error("No workspace was found.");
            const roomId = targetWorkspace.roomId;
            socket.join(roomId);
            //update user status
            const alreadyExists = yield db_1.default.workspaceUser.findUnique({
                where: {
                    id: userIdentifier,
                },
            });
            if (!alreadyExists) {
                yield db_1.default.workspaceUser.create({
                    data: {
                        id: userIdentifier,
                        workspaceId: targetWorkspace.id,
                    },
                });
            }
            else {
                yield (0, utils_1.updateWorkspaceUser)(userIdentifier, {
                    status: client_1.WorkspaceUserStatus.ONLINE,
                });
            }
            //events
            /* emit online status to roomId (dashboard only event) */
            socket.to(roomId).emit("status", {
                id: userIdentifier,
                status: client_1.WorkspaceUserStatus.ONLINE,
            });
            /* socket disconnect */
            socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
                yield (0, utils_1.updateWorkspaceUser)(userIdentifier, {
                    status: client_1.WorkspaceUserStatus.OFFLINE,
                });
                socket.to(apiKey).emit("status", {
                    id: userIdentifier,
                    status: client_1.WorkspaceUserStatus.OFFLINE,
                });
            }));
        }
    }
    catch (err) {
        //error handling
        return null;
    }
}));
io.listen(3002);
