# WhatsApp Clone - Real-time Chat Application

A real-time chat application built with Node.js, Express, Socket.IO, and MongoDB, inspired by WhatsApp's design and functionality.

## Author

- **Name:** Zaid Haider
- **Email:** zaidhaider9@gmail.com
- **GitHub:** [@zaidhaider9](https://github.com/zaidhaider9)

## Features

- Real-time messaging
- User authentication (login/register)
- Online/offline status
- Profile management (photo and name)
- Chat history
- Message status indicators
- Responsive design

## Tech Stack

- **Backend:**
  - Node.js
  - Express.js
  - Socket.IO
  - MongoDB
  - Mongoose
  - Express-session
  - Bcrypt
  - Formidable

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript
  - EJS (Embedded JavaScript)
  - Socket.IO Client

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/realtime-chat-app.git
cd realtime-chat-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/chat-app
SESSION_SECRET=your-secret-key
PORT=3000
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
realtime-chat-app/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── images/
│   └── views/
│       ├── index.ejs
│       ├── login.ejs
│       └── register.ejs
├── src/
│   ├── models/
│   │   ├── User.js
│   │   └── Chat.js
│   └── server.js
├── .env
├── package.json
└── README.md
```

## API Documentation

### Authentication

#### Register User
- **Endpoint:** `POST /register`
- **Request Body:**
```json
{
    "username": "string",
    "password": "string",
    "name": "string"
}
```
- **Response:**
```json
{
    "success": true,
    "user": {
        "_id": "string",
        "username": "string",
        "name": "string",
        "profilePhoto": "string"
    }
}
```

#### Login User
- **Endpoint:** `POST /login`
- **Request Body:**
```json
{
    "username": "string",
    "password": "string"
}
```
- **Response:**
```json
{
    "success": true,
    "user": {
        "_id": "string",
        "username": "string",
        "name": "string",
        "profilePhoto": "string"
    }
}
```

### Profile Management

#### Update Profile Photo
- **Endpoint:** `POST /profile/photo`
- **Request:** FormData with 'photo' file
- **Response:**
```json
{
    "success": true,
    "photo": "string"
}
```

#### Update Profile Name
- **Endpoint:** `POST /profile/name`
- **Request Body:**
```json
{
    "name": "string"
}
```
- **Response:**
```json
{
    "success": true,
    "name": "string"
}
```

### Socket.IO Events

#### Client to Server
- `set user`: Set current user ID
- `user online`: Notify user is online
- `get chat`: Get or create chat with user
- `chat message`: Send message in chat
- `create chat`: Create new chat

#### Server to Client
- `online users`: List of online users
- `chat found`: Chat details
- `chat created`: New chat created
- `chat message`: New message received
- `update chat list`: Update chat list with last message
- `error`: Error notification

## Test Cases

### Authentication Tests

1. **User Registration**
```javascript
// Test successful registration
const testUser = {
    username: "testuser",
    password: "password123",
    name: "Test User"
};
// Expected: Success response with user details

// Test duplicate username
const duplicateUser = {
    username: "testuser",
    password: "password123",
    name: "Duplicate User"
};
// Expected: Error response
```

2. **User Login**
```javascript
// Test successful login
const loginCredentials = {
    username: "testuser",
    password: "password123"
};
// Expected: Success response with user details

// Test invalid credentials
const invalidCredentials = {
    username: "testuser",
    password: "wrongpassword"
};
// Expected: Error response
```

### Chat Functionality Tests

1. **Chat Creation**
```javascript
// Test creating new chat
const chatData = {
    participants: ["user1", "user2"]
};
// Expected: New chat created with both participants

// Test existing chat retrieval
const existingChat = {
    participants: ["user1", "user2"]
};
// Expected: Existing chat returned
```

2. **Message Sending**
```javascript
// Test sending message
const message = {
    chatId: "chat123",
    content: "Hello, World!"
};
// Expected: Message saved and broadcasted to participants

// Test empty message
const emptyMessage = {
    chatId: "chat123",
    content: ""
};
// Expected: Error response
```

### Profile Management Tests

1. **Profile Photo Update**
```javascript
// Test photo upload
const formData = new FormData();
formData.append('photo', imageFile);
// Expected: Photo uploaded and URL returned

// Test invalid file type
const invalidFile = new FormData();
invalidFile.append('photo', textFile);
// Expected: Error response
```

2. **Profile Name Update**
```javascript
// Test name update
const nameUpdate = {
    name: "New Name"
};
// Expected: Name updated successfully

// Test empty name
const emptyName = {
    name: ""
};
// Expected: Error response
```

## Error Handling

The application handles various types of errors:

1. **Authentication Errors**
   - Invalid credentials
   - Duplicate username
   - Session expiration

2. **Chat Errors**
   - Invalid chat ID
   - User not in chat
   - Empty messages

3. **Profile Errors**
   - Invalid file type
   - File size too large
   - Empty name

## Security Measures

1. **Password Security**
   - Passwords are hashed using bcrypt
   - No plain text passwords stored

2. **Session Management**
   - Secure session handling with express-session
   - Session data stored in MongoDB

3. **File Upload Security**
   - File type validation
   - File size limits
   - Secure file storage

## Performance Considerations

1. **Database Optimization**
   - Indexed fields for faster queries
   - Efficient data models

2. **Real-time Updates**
   - Socket.IO rooms for targeted updates
   - Efficient message broadcasting

3. **Client-side Optimization**
   - Lazy loading of chat history
   - Efficient DOM updates

## Future Enhancements

1. **Features to Add**
   - Group chats
   - Message reactions
   - File sharing
   - Voice messages
   - Video calls

2. **Improvements**
   - Message encryption
   - Better error handling
   - Performance optimization
   - UI/UX enhancements

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.

Copyright (c) 2024 Zaid Haider

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. 