/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
// import { auth } from "./lib/auth"; // Will be used for auth middleware

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.io Authentication Middleware
  // io.use(async (socket, next) => {
  //   try {
  //     const session = await auth.api.getSession({
  //       headers: new Headers(socket.request.headers as any),
  //     });
  //     if (!session || !session.user) {
  //       return next(new Error("Unauthorized"));
  //     }
  //     socket.data.user = session.user;
  //     next();
  //   } catch (error) {
  //     next(new Error("Authentication error"));
  //   }
  // });

  interface PresenceMediaInfo {
    title: string;
    description?: string;
    image?: string;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    updatedAt: number;
  }

  // Global Presence Map: socket.id -> { userId, watching }
  const presenceMap = new Map<string, { userId: string, watching: string | null, mediaInfo?: PresenceMediaInfo }>();

  // Watch Party Data Structures
  interface WatchParty {
    id: string;
    hostId: string;
    mediaId: string;
    mediaType: string;
    mediaTitle?: string;
    userLimit: number;
    password?: string;
    users: Map<string, { name: string, image?: string }>; // userId -> user info
    settings: { anyoneCanControl: boolean };
    messages: any[];
  }
  const watchParties = new Map<string, WatchParty>();
  const socketToParty = new Map<string, { partyId: string, userId: string }>();

  function broadcastPresence() {
    const presenceState: Record<string, { watching: string | null, mediaInfo?: PresenceMediaInfo }> = {};
    for (const [_, state] of presenceMap.entries()) {
      if (!presenceState[state.userId] || !presenceState[state.userId].watching || state.mediaInfo) {
        presenceState[state.userId] = { watching: state.watching, mediaInfo: state.mediaInfo };
      }
    }
    console.log("Broadcasting presence sync:", presenceState);
    io.emit("presence_sync", presenceState);
  }

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("user_online", (userId) => {
      console.log(`Socket ${socket.id} is user ${userId}`);
      presenceMap.set(socket.id, { userId, watching: null });
      broadcastPresence();
    });

    socket.on("update_presence", (data) => {
      const currentState = presenceMap.get(socket.id);
      if (currentState) {
        console.log(`User ${currentState.userId} is now watching: ${data.watching}`);
        currentState.watching = data.watching;
        if (data.watching === null) {
          delete currentState.mediaInfo;
        } else if (data.mediaInfo) {
          currentState.mediaInfo = data.mediaInfo;
        }
        presenceMap.set(socket.id, currentState);
        broadcastPresence();
      } else {
        console.log(`Warning: Received update_presence but socket ${socket.id} has no user mapping!`);
      }
    });

    socket.on("send_notification", (userId) => {
      // Find all sockets for this userId and emit new_notification
      for (const [id, state] of presenceMap.entries()) {
        if (state.userId === userId) {
          io.to(id).emit("new_notification");
        }
      }
    });

    socket.on("get_presence", (callback) => {
      const presenceState: Record<string, { watching: string | null, mediaInfo?: PresenceMediaInfo }> = {};
      for (const [_, state] of presenceMap.entries()) {
        if (!presenceState[state.userId] || !presenceState[state.userId].watching || state.mediaInfo) {
          presenceState[state.userId] = { watching: state.watching, mediaInfo: state.mediaInfo };
        }
      }
      if (callback) callback(presenceState);
    });

    // --- Watch Party System ---
    socket.on("create_party", (details, callback) => {
      const partyId = Math.random().toString(36).substring(2, 9);
      const users = new Map<string, { name: string, image?: string }>();
      users.set(details.hostId, { name: details.hostName || "Host", image: details.userImage });
      watchParties.set(partyId, {
        id: partyId,
        hostId: details.hostId,
        mediaId: details.mediaId,
        mediaType: details.mediaType,
        mediaTitle: details.mediaTitle,
        userLimit: details.userLimit,
        password: details.password,
        users,
        settings: { anyoneCanControl: false },
        messages: []
      });
      socketToParty.set(socket.id, { partyId, userId: details.hostId });
      socket.join(`party_${partyId}`);
      if (callback) callback({ success: true, partyId });
    });

    socket.on("join_party", (data, callback) => {
      const { partyId, userId, userName, userImage, password } = data;
      const party = watchParties.get(partyId);
      
      if (!party) return callback && callback({ success: false, error: "Party not found" });
      if (party.password && party.password !== password) return callback && callback({ success: false, error: "Invalid password" });
      if (party.users.size >= party.userLimit && !party.users.has(userId)) return callback && callback({ success: false, error: "Party is full" });

      party.users.set(userId, { name: userName || "Guest", image: userImage });
      socketToParty.set(socket.id, { partyId, userId });
      socket.join(`party_${partyId}`);
      
      const membersList = Array.from(party.users.entries()).map(([id, data]) => ({ id, name: data.name, image: data.image }));
      
      // Notify others in room with name
      socket.broadcast.to(`party_${partyId}`).emit("party_user_joined", { userId, userName: userName || "Guest" });
      // Update members for everyone
      io.to(`party_${partyId}`).emit("party_members_update", { members: membersList });
      
      if (callback) callback({
        success: true,
        hostId: party.hostId,
        settings: party.settings,
        members: membersList,
        messages: party.messages
      });
    });

    socket.on("get_party_members", (data, callback) => {
      const party = watchParties.get(data.partyId);
      if (!party) return callback && callback({ members: [] });
      callback({
        hostId: party.hostId,
        members: Array.from(party.users.entries()).map(([id, data]) => ({ id, name: data.name, image: data.image }))
      });
    });

    socket.on("kick_from_party", (data) => {
      const party = watchParties.get(data.partyId);
      if (!party || party.hostId !== data.hostId) return; // only host can kick
      
      // Find and disconnect the kicked user's socket
      for (const [sid, info] of socketToParty.entries()) {
        if (info.partyId === data.partyId && info.userId === data.kickUserId) {
          party.users.delete(data.kickUserId);
          socketToParty.delete(sid);
          const kickedSocket = io.sockets.sockets.get(sid);
          if (kickedSocket) {
            kickedSocket.leave(`party_${data.partyId}`);
            kickedSocket.emit("party_kicked", { reason: "You were removed by the host." });
          }
          io.to(`party_${data.partyId}`).emit("party_user_left", { userId: data.kickUserId });
          break;
        }
      }
    });

    socket.on("end_party", (data) => {
      const party = watchParties.get(data.partyId);
      if (!party || party.hostId !== data.hostId) return;
      
      io.to(`party_${data.partyId}`).emit("party_ended", { reason: "The host ended the party." });
      // Clean up all sockets in this party
      for (const [sid, info] of socketToParty.entries()) {
        if (info.partyId === data.partyId) {
          const s = io.sockets.sockets.get(sid);
          if (s) s.leave(`party_${data.partyId}`);
          socketToParty.delete(sid);
        }
      }
      watchParties.delete(data.partyId);
    });

    socket.on("invite_to_party", (data) => {
      // Find the friend's socket by their userId in presenceMap
      for (const [sid, state] of presenceMap.entries()) {
        if (state.userId === data.friendId) {
          io.to(sid).emit("party_invite_received", {
            partyId: data.partyId,
            hostId: data.hostId,
            hostName: data.hostName,
            mediaTitle: data.mediaTitle,
            mediaId: data.mediaId,
            mediaType: data.mediaType
          });
        }
      }
    });

    socket.on("refresh_friends_for_user", (data) => {
      // Find the user's socket by their userId in presenceMap
      for (const [sid, state] of presenceMap.entries()) {
        if (state.userId === data.targetUserId) {
          io.to(sid).emit("refresh_friends", data);
        }
      }
    });

    socket.on("party_chat_message", (data) => {
      const party = watchParties.get(data.partyId);
      if (party) {
        party.messages.push(data);
        if (party.messages.length > 50) party.messages.shift();
      }
      io.to(`party_${data.partyId}`).emit("party_chat_message", data);
    });

    socket.on("party_typing", (data) => {
      // data: { partyId, userName, isTyping }
      socket.broadcast.to(`party_${data.partyId}`).emit("party_typing", data);
    });

    socket.on("update_party_settings", (data) => {
      // data: { partyId, hostId, settings }
      const party = watchParties.get(data.partyId);
      if (party && party.hostId === data.hostId) {
        party.settings = data.settings;
        io.to(`party_${data.partyId}`).emit("party_settings_updated", { settings: party.settings });
      }
    });

    socket.on("party_action", (data) => {
      const party = watchParties.get(data.partyId);
      if (!party) return;
      
      // Enforce permissions: if not host and anyoneCanControl is false, block action
      if (!party.settings.anyoneCanControl && data.emitterId !== party.hostId) {
        return;
      }
      
      // data: { partyId, type: 'PLAY' | 'PAUSE' | 'SEEK', time?: number, emitterId: string }
      // Broadcast to everyone else in the room
      socket.broadcast.to(`party_${data.partyId}`).emit("party_action", data);
    });

    socket.on("party_change_media", (data) => {
      // data: { partyId, season, episode }
      socket.broadcast.to(`party_${data.partyId}`).emit("party_change_media", data);
    });

    socket.on("request_sync", (data) => {
      // data: { partyId }
      socket.broadcast.to(`party_${data.partyId}`).emit("request_sync", { targetSocketId: socket.id });
    });

    socket.on("sync_state", (data) => {
      // data: { targetSocketId, time, isPlaying, season, episode }
      io.to(data.targetSocketId).emit("sync_state", data);
    });

    socket.on("party_sync_update", (data) => {
      // data: { partyId, time, isPlaying } - emitted periodically by host
      socket.broadcast.to(`party_${data.partyId}`).emit("party_sync_update", data);
    });

    socket.on("leave_party", () => {
      const partyInfo = socketToParty.get(socket.id);
      if (partyInfo) {
        const { partyId, userId } = partyInfo;
        const party = watchParties.get(partyId);
        if (party) {
          const userName = party.users.get(userId)?.name;
          party.users.delete(userId);
          io.to(`party_${partyId}`).emit("party_user_left", { userId, userName });
          // Broadcast updated member list
          io.to(`party_${partyId}`).emit("party_members_update", {
            members: Array.from(party.users.entries()).map(([id, data]) => ({ id, name: data.name, image: data.image }))
          });
          socket.leave(`party_${partyId}`);
          
          if (party.users.size === 0) {
            watchParties.delete(partyId);
          }
        }
        socketToParty.delete(socket.id);
      }
    });

    // Cleanup on disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      presenceMap.delete(socket.id);
      broadcastPresence();

      const partyInfo = socketToParty.get(socket.id);
      if (partyInfo) {
        const { partyId, userId } = partyInfo;
        const party = watchParties.get(partyId);
        if (party) {
          const userName = party.users.get(userId)?.name;
          party.users.delete(userId);
          io.to(`party_${partyId}`).emit("party_user_left", { userId, userName });
          io.to(`party_${partyId}`).emit("party_members_update", {
            members: Array.from(party.users.entries()).map(([id, data]) => ({ id, name: data.name, image: data.image }))
          });
          
          if (party.users.size === 0) {
            watchParties.delete(partyId);
          }
        }
        socketToParty.delete(socket.id);
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> DAOBAN Server (Next.js + Socket.io) ready on http://${hostname}:${port}`);
    });
});
