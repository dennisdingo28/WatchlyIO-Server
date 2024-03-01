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
const io = new socket_io_1.Server({ cors: { origin: "*" } });
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("new connection", socket.id, socket.handshake.query);
    const identifier = socket.handshake.query.id;
    const apiKey = socket.handshake.query.apiKey;
    socket.join(apiKey);
    if (!apiKey || apiKey.trim() === "")
        return;
    try {
        const targetWorkspace = yield db_1.default.workspace.findUnique({
            where: {
                apiKey,
            },
        });
        const alreadyExists = yield db_1.default.workspaceUser.findUnique({
            where: {
                id: identifier,
            },
        });
        if (!alreadyExists) {
            yield db_1.default.workspaceUser.create({
                data: {
                    id: identifier,
                    workspaceId: targetWorkspace.id,
                },
            });
        }
        else {
            yield db_1.default.workspaceUser.update({
                where: {
                    id: identifier,
                },
                data: {
                    status: client_1.WorkspaceUserStatus.ONLINE,
                },
            });
        }
        socket.to(apiKey).emit("status", { id: identifier, status: client_1.WorkspaceUserStatus.ONLINE });
    }
    catch (err) {
    }
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("discoonect");
        try {
            yield db_1.default.workspaceUser.update({
                where: {
                    id: identifier,
                },
                data: {
                    status: client_1.WorkspaceUserStatus.OFFLINE,
                },
            });
            socket.to(apiKey).emit("status", { id: identifier, status: client_1.WorkspaceUserStatus.OFFLINE });
        }
        catch (err) {
        }
    }));
}));
io.listen(3002);
