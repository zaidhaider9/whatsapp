const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const formidable = require('formidable');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Chat = require('./models/Chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../public/views'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app',
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Store online users
const onlineUsers = new Map();

// Routes
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    try {
        const { username, password, name } = req.body;
        console.log('Registering user:', { username, name });

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('User already exists:', username);
            return res.render('register', { error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed');

        // Create new user
        const user = new User({
            username,
            password: hashedPassword,
            name,
            profilePhoto: '/images/default-avatar.png'
        });

        // Save user
        await user.save();
        console.log('User saved:', user._id);

        // Set session
        req.session.user = {
            _id: user._id,
            username: user.username,
            name: user.name,
            profilePhoto: user.profilePhoto
        };

        // Redirect to home
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { error: 'Registration failed. Please try again.' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', username);

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username);
            return res.render('login', { error: 'Invalid credentials' });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('Invalid password for user:', username);
            return res.render('login', { error: 'Invalid credentials' });
        }

        console.log('Login successful:', user._id);

        // Set session
        req.session.user = {
            _id: user._id,
            username: user.username,
            name: user.name,
            profilePhoto: user.profilePhoto
        };

        // Redirect to home
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Login failed. Please try again.' });
    }
});

app.post('/profile/photo', async (req, res) => {
    try {
        const form = formidable({
            uploadDir: path.join(__dirname, '../public/uploads'),
            keepExtensions: true
        });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to upload photo' });
            }

            const user = await User.findById(req.session.user._id);
            const photoPath = '/uploads/' + path.basename(files.photo.filepath);
            user.profilePhoto = photoPath;
            await user.save();
            res.json({ success: true, photo: user.profilePhoto });
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile photo' });
    }
});

app.post('/profile/name', async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findById(req.session.user._id);
        user.name = name;
        await user.save();
        res.json({ success: true, name: user.name });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update name' });
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user online status
    socket.on('user online', async (userId) => {
        console.log('User online:', userId);
        try {
            const user = await User.findById(userId);
            if (user) {
                onlineUsers.set(socket.id, user);
                socket.userId = userId;
                socket.join(userId); // Join user's room
                io.emit('online users', Array.from(onlineUsers.values()));
            }
        } catch (error) {
            console.error('Error setting user online:', error);
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        onlineUsers.delete(socket.id);
        io.emit('online users', Array.from(onlineUsers.values()));
    });

    // Handle chat creation
    socket.on('create chat', async (data) => {
        console.log('Creating new chat:', data);
        try {
            const { participants, content } = data;
            const chat = new Chat({
                participants,
                messages: [{
                    sender: socket.userId,
                    content,
                    timestamp: new Date()
                }]
            });
            await chat.save();
            console.log('Chat created:', chat);

            // Join chat room for all participants
            participants.forEach(participantId => {
                const participantSocket = Array.from(io.sockets.sockets.values())
                    .find(s => s.userId === participantId);
                if (participantSocket) {
                    participantSocket.join(chat._id);
                }
            });

            // Notify all participants
            participants.forEach(participantId => {
                const participantSocket = Array.from(io.sockets.sockets.values())
                    .find(s => s.userId === participantId);
                
                if (participantSocket) {
                    // Send chat created event
                    participantSocket.emit('chat created', chat);
                    
                    // Update chat list
                    participantSocket.emit('update chat list', {
                        chatId: chat._id,
                        participants: participants,
                        lastMessage: {
                            content: content,
                            timestamp: new Date()
                        }
                    });

                    // If this is the sender, set current chat
                    if (participantId === socket.userId) {
                        participantSocket.emit('chat found', chat);
                    }
                }
            });
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    });

    // Handle get chat
    socket.on('get chat', async (data) => {
        console.log('Getting chat:', data);
        try {
            const { participants } = data;
            const chat = await Chat.findOne({
                participants: { $all: participants }
            }).populate('messages.sender', 'name profilePhoto');
            
            if (chat) {
                console.log('Chat found:', chat);
                // Join chat room
                socket.join(chat._id);
                
                // Ensure each message has sender info
                chat.messages = chat.messages.map(message => {
                    if (!message.sender) {
                        message.sender = message.senderId || message.userId;
                    }
                    return message;
                });
                socket.emit('chat found', chat);
            } else {
                console.log('Chat not found, creating new one');
                const newChat = new Chat({
                    participants,
                    messages: []
                });
                await newChat.save();
                socket.join(newChat._id);
                socket.emit('chat found', newChat);
            }
        } catch (error) {
            console.error('Error finding chat:', error);
        }
    });

    // Handle chat messages
    socket.on('chat message', async (data) => {
        console.log('Received chat message event:', data);
        try {
            if (!data || !data.chatId || !data.content) {
                console.error('Invalid message data:', data);
                return;
            }

            const { chatId, content } = data;
            console.log('Processing message:', { chatId, content });
            
            const chat = await Chat.findById(chatId);
            if (!chat) {
                console.error('Chat not found:', chatId);
                return;
            }

            if (!chat.participants.includes(socket.userId)) {
                console.error('User not in chat participants:', socket.userId);
                return;
            }

            const message = {
                sender: socket.userId,
                content,
                timestamp: new Date()
            };

            chat.messages.push(message);
            await chat.save();
            console.log('Message saved:', message);

            // Update chat list for all participants
            chat.participants.forEach(participantId => {
                const participantSocket = Array.from(io.sockets.sockets.values())
                    .find(s => s.userId === participantId);
                
                if (participantSocket) {
                    // Update chat list
                    participantSocket.emit('update chat list', {
                        chatId: chat._id,
                        participants: chat.participants,
                        lastMessage: message
                    });

                    // Send message to chat room
                    participantSocket.emit('chat message', {
                        ...message,
                        chatId: chat._id
                    });
                }
            });
        } catch (error) {
            console.error('Error in chat message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });
});

// Add authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Protect routes
app.get('/', isAuthenticated, (req, res) => {
    res.render('index', { user: req.session.user });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 