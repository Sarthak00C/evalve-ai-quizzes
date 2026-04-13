import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { useInMemoryDB, findUserByEmail, createUser, findUserById, getEntityId } from '../store.js';
const router = Router();
// Sign up
router.post('/signup', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').isIn(['teacher', 'student']),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password, name, role } = req.body;
        let user;
        if (useInMemoryDB) {
            const existingUser = await findUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            user = await createUser(email, password, name, role);
        }
        else {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            user = new User({
                email,
                password,
                name,
                role: role,
            });
            await user.save();
        }
        const token = generateToken(getEntityId(user) ?? '');
        res.status(201).json({
            token,
            user: {
                id: getEntityId(user),
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
});
// Sign in
router.post('/signin', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        let user = null;
        if (useInMemoryDB) {
            user = await findUserByEmail(email);
        }
        else {
            user = await User.findOne({ email });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isMatch = useInMemoryDB
            ? await bcrypt.compare(password, user.password)
            : await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = generateToken(getEntityId(user) ?? '');
        res.json({
            token,
            user: {
                id: getEntityId(user),
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Signin failed' });
    }
});
// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const user = useInMemoryDB
            ? await findUserById(req.user.id)
            : await User.findById(req.user.id);
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
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
export default router;
//# sourceMappingURL=auth.js.map