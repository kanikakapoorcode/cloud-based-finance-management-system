const socketIO = require('socket.io');

// Store active connections
const activeConnections = new Map();

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
const setupSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', (userId) => {
      if (userId) {
        activeConnections.set(userId, socket.id);
        console.log(`User ${userId} connected with socket ${socket.id}`);
        
        // Send connection confirmation
        socket.emit('authenticated', { success: true, userId });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      // Remove from active connections
      for (const [userId, socketId] of activeConnections.entries()) {
        if (socketId === socket.id) {
          activeConnections.delete(userId);
          console.log(`Removed user ${userId} from active connections`);
          break;
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

/**
 * Send a real-time notification to a specific user
 * @param {string} userId - ID of the user to notify
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 * @param {Object} io - Socket.IO server instance
 */
const notifyUser = (userId, event, data, io) => {
  const socketId = activeConnections.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
};

/**
 * Broadcast an event to all connected clients
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 * @param {Object} io - Socket.IO server instance
 */
const broadcast = (event, data, io) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  setupSocket,
  notifyUser,
  broadcast,
  activeConnections,
};
