// Khi trang được tải xong
window.onload = function() {
  const user = JSON.parse(localStorage.getItem('user')); // Lấy thông tin user từ localStorage
  if (user) {
    if (user.avatarUrl) {
      document.getElementById('avatarImg').src = user.avatarUrl; // Hiển thị avatar
    }
    document.getElementById('userEmail').textContent = user.email; // Hiển thị email
  } else {
    window.location.href = 'login.html'; // Nếu chưa đăng nhập thì chuyển về trang đăng nhập
  }
}; 