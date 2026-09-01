const { io } = require("socket.io-client");
const socket = io("http://localhost:3000", { path: "/socket.io" });
socket.on("connect", () => {
  console.log("Connected to server", socket.id);
  socket.emit("user_online", "test-user-123");
  setTimeout(() => {
    socket.emit("update_presence", { watching: "TEST MOVIE" });
  }, 1000);
});
socket.on("presence_sync", (state) => {
  console.log("Got presence sync:", state);
});
