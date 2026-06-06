import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import categoriesRouter from './routes/categories';
import businessesRouter from './routes/businesses';
import registerRouter from './routes/register';
import authRouter from './routes/auth';
import reviewsRouter from './routes/reviews';
import messagesRouter from './routes/messages';
import serviceRequestsRouter from './routes/serviceRequests';
import servicePostsRouter from './routes/servicePosts';
import postcodeRouter from './routes/postcode';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/businesses', businessesRouter);
app.use('/api/register', registerRouter);
app.use('/api/auth', authRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/service-requests', serviceRequestsRouter);
app.use('/api/service-posts', servicePostsRouter);
app.use('/api/postcode', postcodeRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'NepaliOriPari API is running' });
});

// Socket.IO for real-time chat
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;

  // Join a room based on user ID for direct messaging
  socket.join(`user_${userId}`);

  // Handle joining a conversation room
  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
  });

  // Handle sending a message via socket
  socket.on('send_message', (data: { conversationId: string; receiverId: number; content: string }) => {
    // Emit to the conversation room and receiver's personal room
    io.to(data.conversationId).emit('new_message', {
      conversationId: data.conversationId,
      senderId: userId,
      content: data.content,
      created_at: new Date().toISOString(),
    });

    // Notify receiver if not in the conversation room
    io.to(`user_${data.receiverId}`).emit('message_notification', {
      conversationId: data.conversationId,
      senderId: userId,
    });
  });

  socket.on('disconnect', () => {
    // Cleanup if needed
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
export default app;
