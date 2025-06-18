const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Store active rooms and users
const rooms = new Map();
const users = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', (data) => {
    const { roomId, username, isHost } = data;
    
    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        host: socket.id,
        participants: new Map(),
        messages: [],
        isScreenSharing: false,
        screenSharer: null
      });
    }

    const room = rooms.get(roomId);
    
    // Add user to room
    room.participants.set(socket.id, {
      id: socket.id,
      username: username,
      isHost: isHost,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false
    });

    // Store user info
    users.set(socket.id, {
      roomId: roomId,
      username: username
    });

    socket.join(roomId);

    // Notify others in room
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      username: username,
      isHost: isHost
    });

    // Send room info to joining user
    socket.emit('room-info', {
      roomId: roomId,
      participants: Array.from(room.participants.values()),
      messages: room.messages,
      isScreenSharing: room.isScreenSharing,
      screenSharer: room.screenSharer
    });

    // Update participant count for all users in room
    io.to(roomId).emit('participant-count-updated', {
      count: room.participants.size
    });

    console.log(`${username} joined room ${roomId}`);
  });

  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // Handle chat messages
  socket.on('send-message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room) return;

    const message = {
      id: uuidv4(),
      userId: socket.id,
      username: user.username,
      message: data.message,
      timestamp: new Date().toISOString()
    };

    room.messages.push(message);
    io.to(user.roomId).emit('new-message', message);
  });

  // Handle user state changes
  socket.on('toggle-mute', (isMuted) => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room || !room.participants.has(socket.id)) return;

    room.participants.get(socket.id).isMuted = isMuted;
    socket.to(user.roomId).emit('user-mute-changed', {
      userId: socket.id,
      isMuted: isMuted
    });
  });

  socket.on('toggle-video', (isVideoOff) => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room || !room.participants.has(socket.id)) return;

    room.participants.get(socket.id).isVideoOff = isVideoOff;
    socket.to(user.roomId).emit('user-video-changed', {
      userId: socket.id,
      isVideoOff: isVideoOff
    });
  });

  // Handle screen sharing
  socket.on('start-screen-share', () => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room) return;

    room.isScreenSharing = true;
    room.screenSharer = socket.id;
    room.participants.get(socket.id).isScreenSharing = true;

    socket.to(user.roomId).emit('screen-share-started', {
      sharerId: socket.id,
      sharerName: user.username
    });
  });

  socket.on('stop-screen-share', () => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(user.roomId);
    if (!room) return;

    room.isScreenSharing = false;
    room.screenSharer = null;
    room.participants.get(socket.id).isScreenSharing = false;

    socket.to(user.roomId).emit('screen-share-stopped', {
      sharerId: socket.id
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const user = users.get(socket.id);
    if (user) {
      const room = rooms.get(user.roomId);
      if (room) {
        room.participants.delete(socket.id);
        
        // If room is empty, delete it
        if (room.participants.size === 0) {
          rooms.delete(user.roomId);
          console.log(`Room ${user.roomId} deleted (empty)`);
        } else {
          // If host left, assign new host
          if (room.host === socket.id) {
            const newHost = room.participants.keys().next().value;
            room.host = newHost;
            room.participants.get(newHost).isHost = true;
            
            io.to(user.roomId).emit('host-changed', {
              newHostId: newHost,
              newHostName: room.participants.get(newHost).username
            });
          }
          
          // Notify others about user leaving
          socket.to(user.roomId).emit('user-left', {
            userId: socket.id,
            username: user.username
          });
          
          // Update participant count for remaining users
          io.to(user.roomId).emit('participant-count-updated', {
            count: room.participants.size
          });
        }
      }
      users.delete(socket.id);
    }
  });
});

// API Routes
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    participantCount: room.participants.size,
    isScreenSharing: room.isScreenSharing
  }));
  res.json(roomList);
});

app.post('/api/rooms', (req, res) => {
  const roomId = uuidv4();
  res.json({ roomId });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
}); 