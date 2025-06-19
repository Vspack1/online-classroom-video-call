// Xử lý đăng nhập cơ bản (email, mật khẩu, avatar)
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Ngăn không cho trang bị tải lại khi submit form
    const email = document.getElementById('email').value; // Lấy giá trị email
    const password = document.getElementById('password').value; // Lấy giá trị mật khẩu
    const avatarInput = document.getElementById('avatar'); // Lấy input ảnh đại diện
    let avatarUrl = '';

    if (avatarInput.files && avatarInput.files[0]) { // Nếu có chọn ảnh
      const reader = new FileReader();
      reader.onload = function(e) {
        avatarUrl = e.target.result; // Lấy dữ liệu ảnh dưới dạng base64
        saveUser(email, avatarUrl); // Lưu thông tin user
      };
      reader.readAsDataURL(avatarInput.files[0]); // Đọc file ảnh
    } else {
      saveUser(email, ''); // Nếu không có ảnh thì lưu rỗng
    }

    function saveUser(email, avatarUrl) {
      localStorage.setItem('user', JSON.stringify({ email, avatarUrl })); // Lưu thông tin user vào trình duyệt
      window.location.href = 'home.html'; // Chuyển sang trang chủ
    }
  });
}

// Đăng nhập với Google
if (document.getElementById('googleLogin')) {
  document.getElementById('googleLogin').onclick = function() {
    // Tạo link đăng nhập Google OAuth
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=email%20profile`;
    window.location.href = url; // Chuyển hướng sang Google để đăng nhập
  };
}

// Xử lý sau khi Google redirect về (khi đăng nhập Google thành công)
window.onload = function() {
  // Kiểm tra trên URL có access_token không (nếu có là đăng nhập Google thành công)
  const hash = window.location.hash;
  if (hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    // Gọi API Google để lấy thông tin user (email, avatar)
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: 'Bearer ' + accessToken }
    })
    .then(res => res.json())
    .then(user => {
      // Lưu thông tin user vào localStorage
      localStorage.setItem('user', JSON.stringify({
        email: user.email,
        avatarUrl: user.picture
      }));
      window.location.href = 'home.html'; // Chuyển sang trang chủ
    });
  }
}; 