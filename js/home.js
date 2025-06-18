// Home page functionality
document.addEventListener('DOMContentLoaded', () => {
  const createRoomForm = document.getElementById('create-room-form');
  const joinRoomForm = document.getElementById('join-room-form');
  const createRoomBtn = document.getElementById('create-room-btn');
  const joinRoomBtn = document.getElementById('join-room-btn');
  const roomIdInput = document.getElementById('room-id-input');
  const usernameInput = document.getElementById('username-input');
  const createUsernameInput = document.getElementById('create-username-input');

  // Show create room form
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
      showCreateRoomForm();
    });
  }

  // Show join room form
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', () => {
      showJoinRoomForm();
    });
  }

  // Handle create room form submission
  if (createRoomForm) {
    createRoomForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await createRoom();
    });
  }

  // Handle join room form submission
  if (joinRoomForm) {
    joinRoomForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await joinRoom();
    });
  }

  // Copy room ID to clipboard
  const copyRoomIdBtn = document.getElementById('copy-room-id');
  if (copyRoomIdBtn) {
    copyRoomIdBtn.addEventListener('click', copyRoomId);
  }

  // Generate random room ID
  const generateRoomIdBtn = document.getElementById('generate-room-id');
  if (generateRoomIdBtn) {
    generateRoomIdBtn.addEventListener('click', generateRoomId);
  }
});

// Show create room form
function showCreateRoomForm() {
  const createRoomSection = document.getElementById('create-room-section');
  const joinRoomSection = document.getElementById('join-room-section');
  const welcomeSection = document.getElementById('welcome-section');

  if (welcomeSection) welcomeSection.style.display = 'none';
  if (joinRoomSection) joinRoomSection.style.display = 'none';
  if (createRoomSection) createRoomSection.style.display = 'block';
}

// Show join room form
function showJoinRoomForm() {
  const createRoomSection = document.getElementById('create-room-section');
  const joinRoomSection = document.getElementById('join-room-section');
  const welcomeSection = document.getElementById('welcome-section');

  if (welcomeSection) welcomeSection.style.display = 'none';
  if (createRoomSection) createRoomSection.style.display = 'none';
  if (joinRoomSection) joinRoomSection.style.display = 'block';
}

// Create new room
async function createRoom() {
  const username = document.getElementById('create-username-input')?.value.trim();
  
  if (!username) {
    showNotification('Please enter your name', 'error');
    return;
  }

  try {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    const data = await response.json();
    const roomId = data.roomId;

    // Store username in session storage
    sessionStorage.setItem('username', username);
    
    // Redirect to room
    window.location.href = `/room.html?roomId=${roomId}&host=true`;
  } catch (error) {
    console.error('Error creating room:', error);
    showNotification('Failed to create room. Please try again.', 'error');
  }
}

// Join existing room
async function joinRoom() {
  const roomId = document.getElementById('room-id-input')?.value.trim();
  const username = document.getElementById('username-input')?.value.trim();

  if (!roomId || !username) {
    showNotification('Please enter both room ID and your name', 'error');
    return;
  }

  // Store username in session storage
  sessionStorage.setItem('username', username);
  
  // Redirect to room
  window.location.href = `/room.html?roomId=${roomId}&host=false`;
}

// Generate random room ID
function generateRoomId() {
  const roomIdInput = document.getElementById('room-id-input');
  if (roomIdInput) {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    roomIdInput.value = roomId;
  }
}

// Copy room ID to clipboard
async function copyRoomId() {
  const roomId = document.getElementById('room-id-display')?.textContent;
  
  if (!roomId) {
    showNotification('No room ID to copy', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(roomId);
    showNotification('Room ID copied to clipboard!', 'success');
  } catch (error) {
    console.error('Failed to copy room ID:', error);
    showNotification('Failed to copy room ID', 'error');
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

// Back to home
function backToHome() {
  const createRoomSection = document.getElementById('create-room-section');
  const joinRoomSection = document.getElementById('join-room-section');
  const welcomeSection = document.getElementById('welcome-section');

  if (createRoomSection) createRoomSection.style.display = 'none';
  if (joinRoomSection) joinRoomSection.style.display = 'none';
  if (welcomeSection) welcomeSection.style.display = 'block';
}

// Export functions
window.HomeApp = {
  showCreateRoomForm,
  showJoinRoomForm,
  createRoom,
  joinRoom,
  generateRoomId,
  copyRoomId,
  backToHome
}; 