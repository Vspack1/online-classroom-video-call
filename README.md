# Online Classroom - Video Learning Platform

Một ứng dụng web học tập trực tuyến hoàn chỉnh với các tính năng tương tự Zoom/Google Meet, được xây dựng bằng HTML, CSS (Tailwind), JavaScript và Node.js.

## 🚀 Tính năng

### ✨ Tính năng chính
- **Video Call HD**: Gọi video chất lượng cao với WebRTC
- **Audio Call**: Gọi âm thanh rõ nét
- **Screen Sharing**: Chia sẻ màn hình cho thuyết trình
- **Real-time Chat**: Chat trực tuyến trong cuộc gọi
- **Room Management**: Tạo và tham gia phòng học
- **Participants List**: Danh sách người tham gia
- **Responsive Design**: Giao diện tương thích mọi thiết bị

### 🎯 Tính năng nâng cao
- **Host Management**: Quản lý chủ phòng
- **Mute/Unmute**: Tắt/bật microphone
- **Video On/Off**: Tắt/bật camera
- **Room ID Generation**: Tự động tạo mã phòng
- **Call Duration**: Hiển thị thời gian cuộc gọi
- **Notifications**: Thông báo real-time
- **Auto-reconnect**: Tự động kết nối lại khi mất mạng

## 🛠️ Công nghệ sử dụng

### Frontend
- **HTML5**: Cấu trúc trang web
- **CSS3 + Tailwind CSS**: Styling và responsive design
- **JavaScript (ES6+)**: Logic client-side
- **WebRTC**: Video/audio streaming
- **Socket.IO Client**: Real-time communication

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **Socket.IO**: Real-time bidirectional communication
- **UUID**: Tạo ID duy nhất cho phòng

## 📦 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js (version 14 trở lên)
- npm hoặc yarn
- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)

### Bước 1: Clone và cài đặt dependencies
```bash
# Di chuyển vào thư mục dự án
cd online-classroom

# Cài đặt dependencies
npm install

# Hoặc sử dụng yarn
yarn install
```

### Bước 2: Build CSS
```bash
# Build Tailwind CSS
npm run build

# Hoặc watch mode để tự động build khi có thay đổi
npm run watch
```

### Bước 3: Chạy server
```bash
# Chạy server development
npm run dev

# Hoặc chạy production
npm start
```

### Bước 4: Truy cập ứng dụng
Mở trình duyệt và truy cập: `http://localhost:3000`

## 🎮 Cách sử dụng

### Tạo phòng mới
1. Truy cập trang chủ
2. Click "Create Room"
3. Nhập tên của bạn
4. Click "Create Room"
5. Chia sẻ Room ID với người khác

### Tham gia phòng
1. Truy cập trang chủ
2. Click "Join Room"
3. Nhập Room ID và tên của bạn
4. Click "Join Room"

### Trong cuộc gọi
- **Microphone**: Click nút microphone để tắt/bật âm thanh
- **Camera**: Click nút camera để tắt/bật video
- **Screen Share**: Click nút desktop để chia sẻ màn hình
- **Chat**: Sử dụng tab chat để nhắn tin
- **Participants**: Xem danh sách người tham gia
- **Leave**: Click nút đỏ để rời phòng

## 📁 Cấu trúc dự án

```
online-classroom/
├── index.html          # Trang chủ
├── room.html           # Trang video call
├── server.js           # Server Node.js
├── package.json        # Dependencies và scripts
├── input.css           # Tailwind CSS input
├── output.css          # Tailwind CSS output
├── tailwind.config.js  # Tailwind configuration
├── postcss.config.js   # PostCSS configuration
├── js/
│   ├── app.js          # Logic video call
│   └── home.js         # Logic trang chủ
└── README.md           # Hướng dẫn sử dụng
```

## 🔧 Cấu hình

### Port
Mặc định server chạy trên port 3000. Có thể thay đổi bằng cách set biến môi trường:
```bash
PORT=8080 npm start
```

### STUN Servers
Có thể thay đổi STUN servers trong file `js/app.js`:
```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
```

## 🌐 Deployment

### Heroku
```bash
# Tạo Procfile
echo "web: node server.js" > Procfile

# Deploy
git add .
git commit -m "Deploy to Heroku"
heroku create
git push heroku main
```

### Vercel
```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### DigitalOcean App Platform
1. Connect GitHub repository
2. Select Node.js environment
3. Set build command: `npm run build`
4. Set run command: `npm start`

## 🔒 Bảo mật

### HTTPS
Để sử dụng HTTPS trong production:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/key.pem'),
  cert: fs.readFileSync('path/to/cert.pem')
};

const server = https.createServer(options, app);
```

### Environment Variables
Tạo file `.env` để lưu các biến môi trường:
```env
PORT=3000
NODE_ENV=production
```

## 🐛 Troubleshooting

### Lỗi thường gặp

**1. Không thể truy cập camera/microphone**
- Kiểm tra quyền truy cập trong trình duyệt
- Đảm bảo sử dụng HTTPS trong production
- Thử refresh trang

**2. Không thể kết nối video**
- Kiểm tra firewall
- Thử thay đổi STUN servers
- Kiểm tra kết nối mạng

**3. Socket.IO connection failed**
- Kiểm tra server có đang chạy không
- Kiểm tra port có bị block không
- Thử restart server

### Debug Mode
Bật debug mode trong browser console:
```javascript
localStorage.setItem('debug', 'socket.io:*');
```

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này được phân phối dưới MIT License. Xem file `LICENSE` để biết thêm chi tiết.

## 📞 Hỗ trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi:
- Tạo issue trên GitHub
- Liên hệ qua email: support@onlineclassroom.com

## 🙏 Cảm ơn

Cảm ơn bạn đã sử dụng Online Classroom! Chúng tôi hy vọng ứng dụng này sẽ giúp việc học tập trực tuyến trở nên dễ dàng và hiệu quả hơn.

---

**Made with ❤️ for better learning** 