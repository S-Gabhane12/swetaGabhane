const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const screenMessage = require("./utilis/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utilis/user");
 

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName= "Chat App"

// Set static folder
app.use(express.static(path.join(__dirname, "public")));


// Run when client connects
io.on("connection", (socket) => {
 
    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
    socket.join(user.room)

         // Welcome current user
    socket.emit("message", screenMessage(botName, "Welcome to Chat App!"));
    //  Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        screenMessage(botName, `${user.username} has joined the chat`)
      );

       // Send users and room info
    io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
    })
  })

  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", screenMessage(user.username, msg));
  });


  
 
  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
 
    if (user) {
      io.to(user.room).emit(
        "message",
        screenMessage(botName, `${user.username} has left the chat`)
      );
 
      // Sending users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
});
})

const PORT= 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

