import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { User, AgentUser } from '../models/User.js';
import { updateAgentAvailability, refreshAgentAvailability } from '../services/agentService.js';

const router = express.Router();

// Get all agents
router.get('/', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const agents = await AgentUser.find({}).select('-password');
  res.json(agents);
}));

// Get available agents
router.get('/available', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const availableAgents = await AgentUser.find({
    availability: 'available'
  }).select('-password');
  
  res.json(availableAgents);
}));

// Update agent availability (ADMIN ONLY - agents cannot manually change availability)
router.patch('/:agentId/availability', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const { status } = req.body;
  
  // Only admins can manually update availability
  // Agents' availability is automatically managed through ticket assignment/resolution
  
  // Validate status
  if (!['available', 'busy', 'offline'].includes(status)) {
    return res.status(400).json({
      error: 'Invalid availability status. Must be "available", "busy", or "offline"'
    });
  }
  
  try {
    const updatedAgent = await updateAgentAvailability(agentId, status);
    res.json(updatedAgent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Refresh agent availability based on active tickets (ADMIN ONLY)
router.post('/:agentId/refresh-availability', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  
  // Only admins can manually refresh availability
  // Agents' availability is automatically refreshed when tickets are resolved/assigned
  
  try {
    const updatedAgent = await refreshAgentAvailability(agentId);
    res.json(updatedAgent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

export default router;