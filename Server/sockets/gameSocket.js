const { Server } = require('socket.io');
const logger = require('../config/logger');
const authenticateSocket = require('../middleware/socketAuth');
const { socketRateLimiters } = require('../middleware/socketRateLimit');
const validateSocketInput = require('../middleware/socketValidation');

// Initialize Socket.IO game logic
const initializeGameSocket = (server, Question) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.CORS_ORIGIN 
        : 'http://localhost:3000',
      methods: ["GET", "POST"],
      credentials: true
    },
    // Enable authentication
    auth: {
      token: true
    }
  });

  // Apply authentication middleware to all connections
  io.use(authenticateSocket);

  let waitingPlayer = null;
  let roomCounter = 0; // To generate unique room IDs
  const rooms = {}; // Track rooms and players

  // Function to create a room for a pair of players
  const createRoom = async (player1, player2) => {
    const roomName = `gameRoom_${++roomCounter}`;
    player1.join(roomName);
    player2.join(roomName);
    player1.room = roomName;
    player2.room = roomName;
    rooms[roomName] = [player1, player2];

    try {
      // Fetch random questions and emit to both players
      const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/random-questions`);
      const questions = await response.json();

      // Emit the same questions to both players with user info
      io.to(roomName).emit("bothPlayersReady", { 
        roomId: roomName, 
        questions,
        players: [
          { userId: player1.data.user.userId, username: player1.data.user.username },
          { userId: player2.data.user.userId, username: player2.data.user.username }
        ]
      });
      logger.info(`Both players are in room ${roomName} - Users: ${player1.data.user.username}, ${player2.data.user.username}`);
    } catch (error) {
      logger.error("Error fetching questions:", error);
      io.to(roomName).emit("errorFetchingQuestions", { message: "Failed to fetch questions" });
    }

    io.to(roomName).emit("gameStart", { message: "Game has started!" });
    return roomName;
  };

  io.on("connection", (socket) => {
    const user = socket.data.user;
    logger.info(`Player connected - User: ${user.username} (${user.userId}), Socket ID: ${socket.id}`);

    // Handle authentication errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${user.username}:`, error);
      socket.emit('error', { message: error.message || 'An error occurred' });
    });

    // Handle player joining the game with rate limiting and validation
    socket.on("joinGame", (data, callback) => {
      // Apply rate limiting
      socketRateLimiters.joinGame(socket, data, (err) => {
        if (err) {
          logger.warn(`joinGame rate limited - User: ${user.username}, Socket: ${socket.id}`);
          if (callback) callback({ error: err.message });
          return;
        }

        // Apply validation
        validateSocketInput.joinGame(socket, data, (err) => {
          if (err) {
            logger.warn(`joinGame validation failed - User: ${user.username}, Error: ${err.message}`);
            socket.emit('error', { type: 'validation_error', message: err.message });
            if (callback) callback({ error: err.message });
            return;
          }

          // Business logic
          if (waitingPlayer) {
            // Pair with the waiting player and create a room
            createRoom(waitingPlayer, socket);
            socket.emit("joinRoom", { room: waitingPlayer.room });
            waitingPlayer.emit("joinRoom", { room: waitingPlayer.room });
            waitingPlayer = null; // Reset waiting player
          } else {
            // Set this player as waiting for a partner
            waitingPlayer = socket;
            socket.emit("waiting", { message: "Waiting for another player to join..." });
          }

          if (callback) callback({ success: true });
        });
      });
    });

    // Handle chat message with rate limiting and validation
    socket.on("sendMessage", (data, callback) => {
      // Apply rate limiting
      socketRateLimiters.sendMessage(socket, data, (err) => {
        if (err) {
          logger.warn(`sendMessage rate limited - User: ${user.username}, Socket: ${socket.id}`);
          if (callback) callback({ error: err.message });
          return;
        }

        // Apply validation (this also sanitizes the message)
        validateSocketInput.sendMessage(socket, data, (err) => {
          if (err) {
            logger.warn(`sendMessage validation failed - User: ${user.username}, Error: ${err.message}`);
            socket.emit('error', { type: 'validation_error', message: err.message });
            if (callback) callback({ error: err.message });
            return;
          }

          // Business logic
          const room = socket.room;
          if (room) {
            // Use sanitized message from validation
            const sanitizedMessage = socket.data.sanitizedMessage;
            io.to(room).emit("receiveMessage", { 
              player: socket.id,
              userId: user.userId,
              username: user.username,
              message: sanitizedMessage,
              timestamp: new Date().toISOString()
            });
            if (callback) callback({ success: true });
          } else {
            const error = 'You are not in a game room';
            socket.emit('error', { type: 'not_in_room', message: error });
            if (callback) callback({ error });
          }
        });
      });
    });

    // Handle player surrender with rate limiting and validation
    socket.on("surrender", (data, callback) => {
      // Apply rate limiting
      socketRateLimiters.surrender(socket, data, (err) => {
        if (err) {
          logger.warn(`surrender rate limited - User: ${user.username}, Socket: ${socket.id}`);
          if (callback) callback({ error: err.message });
          return;
        }

        // Apply validation
        validateSocketInput.surrender(socket, data, (err) => {
          if (err) {
            logger.warn(`surrender validation failed - User: ${user.username}, Error: ${err.message}`);
            socket.emit('error', { type: 'validation_error', message: err.message });
            if (callback) callback({ error: err.message });
            return;
          }

          // Business logic
          const room = socket.room;
          if (room) {
            io.to(room).emit("gameOver", { 
              message: `${user.username} has surrendered. Game over!`,
              surrenderedBy: {
                userId: user.userId,
                username: user.username
              }
            });
            io.to(room).emit("redirect", { destination: "/rank-rating" });
            io.in(room).socketsLeave(room); // Disconnect all players in the room
            if (callback) callback({ success: true });
          } else {
            const error = 'You are not in a game room';
            socket.emit('error', { type: 'not_in_room', message: error });
            if (callback) callback({ error });
          }
        });
      });
    });

    // Handle player disconnect
    socket.on("disconnect", (reason) => {
      logger.info(`Player disconnected - User: ${user.username}, Socket: ${socket.id}, Reason: ${reason}`);
      if (waitingPlayer === socket) {
        waitingPlayer = null;
      }
      const room = socket.room;
      if (room) {
        io.to(room).emit("gameOver", { 
          message: `${user.username} disconnected. Game over!`,
          disconnectedBy: {
            userId: user.userId,
            username: user.username
          }
        });
        io.to(room).emit("redirect", { destination: "/rank-rating" });
        io.in(room).socketsLeave(room); // Disconnect all players in the room
      }
    });
  });

  return io;
};

module.exports = initializeGameSocket;
