# BaatCheet Backend

A real-time chat application backend built with Node.js, Express, Socket.IO ans AWS S3.

## 🚀 Features

### 1. Authentication System
- User registration and login
- JWT-based authentication
- Password hashing and security
- Protected routes middleware

### 2. Real-time Chat
- WebSocket-based real-time messaging
- Private and group chat support
- Message delivery status
- Typing indicators
- Online/offline status

### 3. User Management
- User profile management
- Profile picture upload to AWS S3
- User search functionality
- Friend/contact management
- User status updates

### 4. Room Management
- Create and manage chat rooms
- Room member management
- Room settings and permissions
- Room search functionality

### 5. Message Features
- Text messages
- File sharing with AWS S3 storage
- Message history
- Message deletion
- Message editing
- Read receipts

### 6. Notification System
- Real-time notifications
- Push notifications
- Notification preferences
- Notification history

### 7. Security Features
- Rate limiting
- CORS protection
- Input validation
- Error handling
- Secure file uploads to AWS S3

### 8. AWS S3 Integration
- Secure file storage
- Profile picture management
- File upload and retrieval
- Automatic file cleanup
- CDN support for faster delivery

## 📁 Project Structure

```
baatcheetbackend/
├── config/
│    └── db.js                 # Database configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   ├── roomController.js    # Room management
│   ├── messageController.js # Message handling
│   ├── notificationController.js # Notification handling
│   └── searchController.js  # Search particular person/group
├── middleware/
│   ├── authMiddleware.js             # Authentication middleware
│   ├── rateLimitMiddleware.js # Rate limiting
│   └── uploadNiddleware.js           # File upload handling
├── models/
│   ├── User.js             # User model
│   ├── Room.js             # Room model
│   ├── Message.js          # Message model
│   └── Notification.js     # Notification model
├── routes/
│   ├── authRoutes.js       # Authentication routes
│   ├── userRoutes.js       # User routes
│   ├── roomRoutes.js       # Room routes
│   ├── messageRoutes.js    # Message routes
│   ├── notificationRoutes.js # Notification routes
│   └── searchRoutes.js     # Search routes
├── utils/
|   ├── encryption.js          # Encryption purpose
│   └── emailService.js        # AWS S3 service functions
├── sockets/
│   └── socket.js           # Socket.IO event handlers
├── uploads/                # Temporary file upload directory
├── .env                    # Environment variables
├── package.json           # Project dependencies
└── server.js              # Main application file
```

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Real-time:** Socket.IO
- **Authentication:** JWT
- **File Upload:** Multer
- **Security:** bcrypt, helmet
- **Cloud Storage:** AWS S3
- **AWS SDK:** aws-sdk

## 🔧 Setup and Installation

1. Clone the repository:
```bash
git clone https://github.com/bhanuudhay/baat-cheet.git
cd baat-cheet/baatcheetbackend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_bucket_name
```

4. Start the server:
```bash
npm start
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/:roomId` - Get room messages
- `PUT /api/messages/:id` - Update message
- `DELETE /api/messages/:id` - Delete message

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

### File Upload
- `POST /api/upload/profile` - Upload profile picture
- `POST /api/upload/message` - Upload message attachment
- `DELETE /api/upload/:fileId` - Delete uploaded file

## 🔐 Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- Rate limiting to prevent abuse
- CORS protection
- Secure file upload handling
- AWS S3 bucket policies and CORS configuration
- File type validation and size limits
- Secure file URLs with expiration


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Bhanu Udhay Singh

## 🙏 Acknowledgments

- Socket.IO for real-time capabilities
- MongoDB for database
- Express.js for the web framework
- AWS S3 for cloud storage
