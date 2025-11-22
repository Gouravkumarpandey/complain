/**
 * Agent Handler - SIMPLIFIED: Only for basic agent connection tracking
 */

/**
 * Initialize the agent handler
 * @param {object} io - Socket.io instance
 */
export const initAgentHandler = (io) => {
  io.on('connection', (socket) => {
    // Only track that agent is connected - no complex workload tracking
    if (socket.user.role === 'agent') {
      console.log(`Agent ${socket.user.name} connected`);
    }
  });
};