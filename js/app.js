// Global variables
let socket;
let localStream;
let remoteStreams = {};
let peerConnections = {};
let isMuted = false;
let isVideoOff = false;
let isScreenSharing = false;
let currentRoomId = null;
let currentUsername = null;
let isHost = false;

// WebRTC configuration
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// DOM elements
const videoGrid = document.getElementById('video-grid');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const muteButton = document.getElementById('mute-button');
const videoButton = document.getElementById('video-button');
const screenShareButton = document.getElementById('screen-share-button');
const leaveButton = document.getElementById('leave-button');
const participantsList = document.getElementById('participants-list');
const roomInfo = document.getElementById('room-info');

// Initialize the application
async function initApp() {
  try {
    // Get user media
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    // Add local video
    addVideoStream('local', localStream);

    // Initialize Socket.IO
    socket = io();

    // Socket event listeners
    setupSocketListeners();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error accessing camera/microphone. Please check permissions.', 'error');
  }
}

// Setup Socket.IO event listeners
function setupSocketListeners() {
  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('user-joined', handleUserJoined);
  socket.on('user-left', handleUserLeft);
  socket.on('offer', handleOffer);
  socket.on('answer', handleAnswer);
  socket.on('ice-candidate', handleIceCandidate);
  socket.on('new-message', handleNewMessage);
  socket.on('user-mute-changed', handleUserMuteChanged);
  socket.on('user-video-changed', handleUserVideoChanged);
  socket.on('screen-share-started', handleScreenShareStarted);
  socket.on('screen-share-stopped', handleScreenShareStopped);
  socket.on('room-info', handleRoomInfo);
  socket.on('host-changed', handleHostChanged);
}

// Join room
async function joinRoom(roomId, username, host = false) {
  currentRoomId = roomId;
  currentUsername = username;
  isHost = host;

  socket.emit('join-room', {
    roomId: roomId,
    username: username,
    isHost: host
  });

  updateRoomInfo();
}

// Handle user joining
function handleUserJoined(data) {
  console.log('User joined:', data);
  showNotification(`${data.username} joined the room`, 'info');
  
  // Update participant count
  const participantCount = document.getElementById('participant-count');
  if (participantCount) {
    const currentCount = parseInt(participantCount.textContent) || 1;
    participantCount.textContent = (currentCount + 1).toString();
  }
  
  updateParticipantsList();
}

// Handle user leaving
function handleUserLeft(data) {
  console.log('User left:', data);
  showNotification(`${data.username} left the room`, 'info');
  
  // Update participant count
  const participantCount = document.getElementById('participant-count');
  if (participantCount) {
    const currentCount = parseInt(participantCount.textContent) || 1;
    participantCount.textContent = Math.max(1, currentCount - 1).toString();
  }
  
  // Remove video stream
  if (remoteStreams[data.userId]) {
    removeVideoStream(data.userId);
  }
  
  // Close peer connection
  if (peerConnections[data.userId]) {
    peerConnections[data.userId].close();
    delete peerConnections[data.userId];
  }
  
  updateParticipantsList();
}

// Handle room info
function handleRoomInfo(data) {
  console.log('Room info received:', data);
  
  // Add existing participants
  data.participants.forEach(participant => {
    if (participant.id !== socket.id) {
      createPeerConnection(participant.id);
    }
  });
  
  // Load chat messages
  data.messages.forEach(message => {
    addChatMessage(message);
  });
  
  updateParticipantsList();
}

// Create peer connection
function createPeerConnection(userId) {
  const peerConnection = new RTCPeerConnection(rtcConfig);
  peerConnections[userId] = peerConnection;

  // Add local stream
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        target: userId,
        candidate: event.candidate
      });
    }
  };

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      addVideoStream(userId, event.streams[0]);
    }
  };

  return peerConnection;
}

// Handle offer
async function handleOffer(data) {
  const peerConnection = createPeerConnection(data.from);
  
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    socket.emit('answer', {
      target: data.from,
      answer: answer
    });
  } catch (error) {
    console.error('Error handling offer:', error);
  }
}

// Handle answer
async function handleAnswer(data) {
  const peerConnection = peerConnections[data.from];
  if (peerConnection) {
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }
}

// Handle ICE candidate
async function handleIceCandidate(data) {
  const peerConnection = peerConnections[data.from];
  if (peerConnection) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }
}

// Add video stream
function addVideoStream(userId, stream) {
  const videoElement = document.createElement('video');
  videoElement.id = `video-${userId}`;
  videoElement.srcObject = stream;
  videoElement.autoplay = true;
  videoElement.playsInline = true;
  videoElement.muted = userId === 'local';
  
  if (userId === 'local') {
    videoElement.classList.add('local-video');
  }
  
  videoGrid.appendChild(videoElement);
  remoteStreams[userId] = stream;
}

// Remove video stream
function removeVideoStream(userId) {
  const videoElement = document.getElementById(`video-${userId}`);
  if (videoElement) {
    videoElement.remove();
  }
  delete remoteStreams[userId];
}

// Toggle mute
function toggleMute() {
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    isMuted = !audioTrack.enabled;
    
    muteButton.innerHTML = isMuted ? 
      '<i class="fas fa-microphone-slash"></i>' : 
      '<i class="fas fa-microphone"></i>';
    
    socket.emit('toggle-mute', isMuted);
  }
}

// Toggle video
function toggleVideo() {
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    isVideoOff = !videoTrack.enabled;
    
    videoButton.innerHTML = isVideoOff ? 
      '<i class="fas fa-video-slash"></i>' : 
      '<i class="fas fa-video"></i>';
    
    socket.emit('toggle-video', isVideoOff);
  }
}

// Toggle screen sharing
async function toggleScreenShare() {
  try {
    if (!isScreenSharing) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      Object.values(peerConnections).forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      // Update local video
      const localVideo = document.getElementById('video-local');
      if (localVideo) {
        localVideo.srcObject = screenStream;
      }
      
      isScreenSharing = true;
      screenShareButton.innerHTML = '<i class="fas fa-stop"></i>';
      socket.emit('start-screen-share');
      
      // Handle screen share stop
      videoTrack.onended = () => {
        stopScreenShare();
      };
    } else {
      stopScreenShare();
    }
  } catch (error) {
    console.error('Error toggling screen share:', error);
    showNotification('Error sharing screen', 'error');
  }
}

// Stop screen sharing
function stopScreenShare() {
  // Restore camera video track
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      const videoTrack = stream.getVideoTracks()[0];
      
      Object.values(peerConnections).forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      // Update local video
      const localVideo = document.getElementById('video-local');
      if (localVideo) {
        localVideo.srcObject = localStream;
      }
      
      isScreenSharing = false;
      screenShareButton.innerHTML = '<i class="fas fa-desktop"></i>';
      socket.emit('stop-screen-share');
    })
    .catch(error => {
      console.error('Error restoring camera:', error);
    });
}

// Handle screen share started
function handleScreenShareStarted(data) {
  showNotification(`${data.sharerName} started screen sharing`, 'info');
}

// Handle screen share stopped
function handleScreenShareStopped(data) {
  showNotification('Screen sharing stopped', 'info');
}

// Send chat message
function sendMessage() {
  const message = chatInput.value.trim();
  if (message) {
    socket.emit('send-message', { message });
    chatInput.value = '';
  }
}

// Handle new message
function handleNewMessage(message) {
  addChatMessage(message);
}

// Add chat message to UI
function addChatMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  
  const isOwnMessage = message.userId === socket.id;
  messageElement.classList.add(isOwnMessage ? 'own-message' : 'other-message');
  
  const time = new Date(message.timestamp).toLocaleTimeString();
  
  messageElement.innerHTML = `
    <div class="message-header">
      <span class="username">${message.username}</span>
      <span class="time">${time}</span>
    </div>
    <div class="message-content">${message.message}</div>
  `;
  
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle user mute changed
function handleUserMuteChanged(data) {
  // Update UI to show mute status
  console.log(`User ${data.userId} mute changed: ${data.isMuted}`);
}

// Handle user video changed
function handleUserVideoChanged(data) {
  // Update UI to show video status
  console.log(`User ${data.userId} video changed: ${data.isVideoOff}`);
}

// Handle host changed
function handleHostChanged(data) {
  if (data.newHostId === socket.id) {
    isHost = true;
    showNotification('You are now the host', 'info');
  } else {
    isHost = false;
    showNotification(`${data.newHostName} is now the host`, 'info');
  }
  updateParticipantsList();
}

// Update participants list
function updateParticipantsList() {
  if (participantsList) {
    // Clear current list
    participantsList.innerHTML = '';
    
    // Get current participants from server (this would be implemented with actual data)
    // For now, we'll show a placeholder
    const participantElement = document.createElement('div');
    participantElement.className = 'flex items-center justify-between p-3 bg-gray-700 rounded-lg mb-2';
    participantElement.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <i class="fas fa-user text-white text-sm"></i>
        </div>
        <div>
          <p class="text-white font-medium">${currentUsername || 'You'}</p>
          <p class="text-gray-400 text-xs">${isHost ? 'Host' : 'Participant'}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <i class="fas fa-microphone text-green-400"></i>
        <i class="fas fa-video text-green-400"></i>
      </div>
    `;
    participantsList.appendChild(participantElement);
    
    // Update participant count in header
    const participantCount = document.getElementById('participant-count');
    if (participantCount) {
      participantCount.textContent = '1'; // This should be updated with actual count
    }
  }
}

// Update room info
function updateRoomInfo() {
  if (roomInfo) {
    roomInfo.innerHTML = `
      <div class="room-details">
        <h3>Room: ${currentRoomId}</h3>
        <p>Host: ${isHost ? 'You' : 'Someone else'}</p>
      </div>
    `;
  }
}

// Leave room
function leaveRoom() {
  if (confirm('Are you sure you want to leave the room?')) {
    // Close all peer connections
    Object.values(peerConnections).forEach(peerConnection => {
      peerConnection.close();
    });
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Disconnect socket
    if (socket) {
      socket.disconnect();
    }
    
    // Redirect to home page
    window.location.href = '/';
  }
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize app
  initApp();
  
  // Button event listeners
  if (muteButton) muteButton.addEventListener('click', toggleMute);
  if (videoButton) videoButton.addEventListener('click', toggleVideo);
  if (screenShareButton) screenShareButton.addEventListener('click', toggleScreenShare);
  if (leaveButton) leaveButton.addEventListener('click', leaveRoom);
  if (sendButton) sendButton.addEventListener('click', sendMessage);
  
  // Chat input enter key
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
});

// Export functions for use in other files
window.VideoApp = {
  joinRoom,
  leaveRoom,
  toggleMute,
  toggleVideo,
  toggleScreenShare,
  sendMessage
}; 