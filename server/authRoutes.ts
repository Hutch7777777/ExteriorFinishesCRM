import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { 
  generateToken, 
  comparePassword, 
  hashPassword, 
  setAuthCookie, 
  clearAuthCookie,
  authenticateToken,
  requireAdmin,
  type AuthenticatedRequest 
} from './auth';
import type { InsertUser } from '@shared/schema';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['admin', 'staff']).default('staff'),
  divisionId: z.string().uuid().optional(),
});

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token and set cookie
    const token = generateToken(user);
    setAuthCookie(res, token);

    // Return user data (without password hash)
    const { passwordHash, ...userWithoutPassword } = user;
    res.json({ 
      message: 'Login successful',
      user: userWithoutPassword 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: error.errors 
      });
    }
    
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register route (admin-only)
router.post('/register', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, role, divisionId } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userData: InsertUser = {
      email,
      passwordHash,
      name,
      role,
      divisionId: divisionId || null,
    };

    const newUser = await storage.createUser(userData);

    // Return user data (without password hash)
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ 
      message: 'User created successfully',
      user: userWithoutPassword 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: error.errors 
      });
    }
    
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ message: 'Logout successful' });
});

// Get current user route
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not found' });
  }

  const { passwordHash, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// Refresh token route (for future implementation)
router.post('/refresh', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Refresh token not implemented yet' });
});

export default router;