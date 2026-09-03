const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Update WatchParty interface
code = code.replace(
  `    users: Map<string, { name: string, image?: string }>; // userId -> user info`,
  `    mediaSeason?: number;\n    mediaEpisode?: number;\n    users: Map<string, { name: string, image?: string, role: "host" | "dj" | "guest" }>; // userId -> user info`
);

code = code.replace(
  `    messages: any[];\n  }`,
  `    messages: any[];\n    playbackState: {\n      isPlaying: boolean;\n      time: number;\n      updatedAt: number;\n    };\n  }`
);

// 2. Add broadcastSystemMessage before io.on
code = code.replace(
  `  io.on("connection", (socket) => {`,
  `  function broadcastSystemMessage(partyId: string, text: string) {\n    const party = watchParties.get(partyId);\n    if (!party) return;\n    const msg = { id: "sys_" + Math.random().toString(36).substring(2, 9), userId: "system", userName: "System", text, timestamp: Date.now() };\n    party.messages.push(msg);\n    if (party.messages.length > 50) party.messages.shift();\n    io.to(\`party_\${partyId}\`).emit("party_chat_message", msg);\n  }\n\n  io.on("connection", (socket) => {`
);

// 3. Update create_party
code = code.replace(
  `const users = new Map<string, { name: string, image?: string }>();\n      users.set(details.hostId, { name: details.hostName || "Host", image: details.userImage });`,
  `const users = new Map<string, { name: string, image?: string, role: "host" | "dj" | "guest" }>();\n      users.set(details.hostId, { name: details.hostName || "Host", image: details.userImage, role: "host" });`
);

code = code.replace(
  `mediaTitle: details.mediaTitle,\n        userLimit: details.userLimit,`,
  `mediaTitle: details.mediaTitle,\n        mediaSeason: details.mediaSeason,\n        mediaEpisode: details.mediaEpisode,\n        userLimit: details.userLimit,`
);

code = code.replace(
  `settings: { anyoneCanControl: false },\n        messages: []\n      });`,
  `settings: { anyoneCanControl: false },\n        messages: [],\n        playbackState: {\n          isPlaying: false,\n          time: 0,\n          updatedAt: Date.now()\n        }\n      });`
);

// 4. Update join_party
code = code.replace(
  `party.users.set(userId, { name: userName || "Guest", image: userImage });`,
  `party.users.set(userId, { name: userName || "Guest", image: userImage, role: "guest" });`
);

code = code.replace(
  /const membersList = Array\.from\(party\.users\.entries\(\)\)\.map\(\(\[id, data\]\) => \(\{ id, name: data\.name, image: data\.image \}\)\);/g,
  `const membersList = Array.from(party.users.entries()).map(([id, data]) => ({ id, name: data.name, image: data.image, role: data.role }));`
);

// 5. Replace party_action to party_sync_update with new logic
const oldLogic = `    socket.on("party_action", (data) => {
      const party = watchParties.get(data.partyId);
      if (!party) return;
      
      // Enforce permissions: if not host and anyoneCanControl is false, block action
      if (!party.settings.anyoneCanControl && data.emitterId !== party.hostId) {
        return;
      }
      
      // data: { partyId, type: 'PLAY' | 'PAUSE' | 'SEEK', time?: number, emitterId: string }
      // Broadcast to everyone else in the room
      socket.broadcast.to(\`party_\${data.partyId}\`).emit("party_action", data);
    });

    socket.on("party_change_media", (data) => {
      // data: { partyId, season, episode }
      socket.broadcast.to(\`party_\${data.partyId}\`).emit("party_change_media", data);
    });

    socket.on("request_sync", (data) => {
      // data: { partyId }
      socket.broadcast.to(\`party_\${data.partyId}\`).emit("request_sync", { targetSocketId: socket.id });
    });

    socket.on("sync_state", (data) => {
      // data: { targetSocketId, time, isPlaying, season, episode }
      io.to(data.targetSocketId).emit("sync_state", data);
    });

    socket.on("party_sync_update", (data) => {
      // data: { partyId, time, isPlaying } - emitted periodically by host
      socket.broadcast.to(\`party_\${data.partyId}\`).emit("party_sync_update", data);
    });`;

const newLogic = `    function canControl(party, userId) {
      if (party.settings.anyoneCanControl) return true;
      const user = party.users.get(userId);
      return user?.role === "host" || user?.role === "dj";
    }

    socket.on("party_play", (data) => {
      const party = watchParties.get(data.partyId);
      const info = socketToParty.get(socket.id);
      if (!party || !info || !canControl(party, info.userId)) return;

      party.playbackState = { isPlaying: true, time: data.time, updatedAt: Date.now() };
      const userName = party.users.get(info.userId)?.name || "Someone";
      io.to(\`party_\${data.partyId}\`).emit("party_state_update", party.playbackState);
      broadcastSystemMessage(data.partyId, \`\${userName} played the video.\`);
    });

    socket.on("party_pause", (data) => {
      const party = watchParties.get(data.partyId);
      const info = socketToParty.get(socket.id);
      if (!party || !info || !canControl(party, info.userId)) return;

      party.playbackState = { isPlaying: false, time: data.time, updatedAt: Date.now() };
      const userName = party.users.get(info.userId)?.name || "Someone";
      io.to(\`party_\${data.partyId}\`).emit("party_state_update", party.playbackState);
      broadcastSystemMessage(data.partyId, \`\${userName} paused the video.\`);
    });

    socket.on("party_seek", (data) => {
      const party = watchParties.get(data.partyId);
      const info = socketToParty.get(socket.id);
      if (!party || !info || !canControl(party, info.userId)) return;

      party.playbackState.time = data.time;
      party.playbackState.updatedAt = Date.now();
      const userName = party.users.get(info.userId)?.name || "Someone";
      io.to(\`party_\${data.partyId}\`).emit("party_state_update", party.playbackState);
      broadcastSystemMessage(data.partyId, \`\${userName} jumped to \${Math.floor(data.time / 60)}:\${Math.floor(data.time % 60).toString().padStart(2, '0')}.\`);
    });

    socket.on("request_party_state", (partyId) => {
      const party = watchParties.get(partyId);
      if (party) socket.emit("party_state_update", party.playbackState);
    });

    socket.on("party_change_media", (data) => {
      const party = watchParties.get(data.partyId);
      const info = socketToParty.get(socket.id);
      if (!party || !info || !canControl(party, info.userId)) return;

      party.mediaSeason = data.season;
      party.mediaEpisode = data.episode;
      const userName = party.users.get(info.userId)?.name || "Someone";
      io.to(\`party_\${data.partyId}\`).emit("party_change_media", { season: data.season, episode: data.episode });
      broadcastSystemMessage(data.partyId, \`\${userName} changed the episode to S\${data.season || '?'} E\${data.episode || '?'}.\`);
    });

    socket.on("grant_dj", (data) => {
      const party = watchParties.get(data.partyId);
      const info = socketToParty.get(socket.id);
      if (!party || !info || party.hostId !== info.userId) return;

      const targetUser = party.users.get(data.targetId);
      if (targetUser && targetUser.role === "guest") {
        targetUser.role = "dj";
        io.to(\`party_\${data.partyId}\`).emit("party_members_update", {
          members: Array.from(party.users.entries()).map(([id, u]) => ({ id, name: u.name, image: u.image, role: u.role }))
        });
        broadcastSystemMessage(data.partyId, \`\${targetUser.name} was promoted to DJ.\`);
      }
    });

    socket.on("revoke_dj", (data) => {
      const party = watchParties.get(data.partyId);
      const info = socketToParty.get(socket.id);
      if (!party || !info || party.hostId !== info.userId) return;

      const targetUser = party.users.get(data.targetId);
      if (targetUser && targetUser.role === "dj") {
        targetUser.role = "guest";
        io.to(\`party_\${data.partyId}\`).emit("party_members_update", {
          members: Array.from(party.users.entries()).map(([id, u]) => ({ id, name: u.name, image: u.image, role: u.role }))
        });
        broadcastSystemMessage(data.partyId, \`\${targetUser.name} is no longer a DJ.\`);
      }
    });`;

code = code.replace(oldLogic, newLogic);

fs.writeFileSync('server.ts', code);
console.log("Successfully updated server.ts");
