// Xử lý đăng nhập cơ bản
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const avatarInput = document.getElementById('avatar');
    let avatarUrl = '';

    if (avatarInput.files && avatarInput.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        avatarUrl = e.target.result;
        saveUser(email, avatarUrl);
      };
      reader.readAsDataURL(avatarInput.files[0]);
    } else {
      saveUser(email, '');
    }

    function saveUser(email, avatarUrl) {
      localStorage.setItem('user', JSON.stringify({ email, avatarUrl }));
      window.location.href = 'home.html';
    }
  });
}

// Đăng nhập với Google
if (document.getElementById('googleLogin')) {
  document.getElementById('googleLogin').onclick = function() {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=email%20profile`;
    window.location.href = url;
  };
}

// Xử lý sau khi Google redirect về
window.onload = function() {
  // Nếu có access_token trên URL
  const hash = window.location.hash;
  if (hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    // Lấy thông tin user từ Google
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: 'Bearer ' + accessToken }
    })
    .then(res => res.json())
    .then(user => {
      localStorage.setItem('user', JSON.stringify({
        email: user.email,
        avatarUrl: user.picture
      }));
      window.location.href = 'home.html';
    });
  }
}; 