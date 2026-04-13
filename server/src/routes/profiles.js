import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { useInMemoryDB, findUserById, updateUserName, findUsersByIds, getEntityId } from '../store.js';
const router = Router();
// Update profile
router.put('/:id', authenticateToken, [body('name').trim().optional().notEmpty()], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // Users can only update their own profile
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ error: 'Cannot update other user profiles' });
        }
        const { name } = req.body;
        const user = useInMemoryDB
            ? await updateUserName(req.user.id, name)
            : await User.findByIdAndUpdate(req.user.id, name ? { name } : {}, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            user: {
                id: getEntityId(user),
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
// Get profile by ID
router.get('/:id', authenticateToken, async (_req, res) => {
    try {
        const user = useInMemoryDB
            ? await findUserById(_req.params.id)
            : await User.findById(_req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: getEntityId(user),
            role: user.role,
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});
// Get multiple profiles
router.post('/batch', authenticateToken, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'ids must be an array' });
        }
        const users = useInMemoryDB
            ? await findUsersByIds(ids)
            : await User.find({ _id: { $in: ids } }).select('id name email -password');
        res.json({
            profiles: users.map((user) => ({
                id: getEntityId(user),
                name: user.name,
                email: user.email,
            })),
        });
    }
    catch (error) {
        console.error('Get batch profiles error:', error);
        res.status(500).json({ error: 'Failed to get profiles' });
    }
});
export default router;
//# sourceMappingURL=profiles.js.map