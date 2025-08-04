import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthUser, User } from '@/types';
import { usersStore } from './data';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isApproved: user.isApproved,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token: string): AuthUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const authenticateUser = async (email: string, password: string): Promise<AuthUser | null> => {
  const user = usersStore.findOne(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return null;
  }

  const isValidPassword = await comparePassword(password, user.password);
  
  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isApproved: user.isApproved,
  };
};

export const getUserFromToken = (token: string): User | null => {
  const authUser = verifyToken(token);
  if (!authUser) return null;
  
  return usersStore.findById(authUser.id);
};

export const requireAuth = (requiredRoles?: string[]) => {
  return (handler: any) => {
    return async (req: any, res: any) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return res.status(401).json({ success: false, error: 'No token provided' });
        }

        const user = verifyToken(token);
        
        if (!user) {
          return res.status(401).json({ success: false, error: 'Invalid token' });
        }

        if (requiredRoles && !requiredRoles.includes(user.role)) {
          return res.status(403).json({ success: false, error: 'Insufficient permissions' });
        }

        req.user = user;
        return handler(req, res);
      } catch (error) {
        return res.status(500).json({ success: false, error: 'Authentication error' });
      }
    };
  };
};

export const checkEligibility = (userZipCode: string): boolean => {
  // This function checks if a user's zip code is in an active disaster zone
  const { disasterZonesStore } = require('./data');
  const activeZones = disasterZonesStore.findBy((zone: any) => zone.isActive);
  
  // For now, we'll implement a simple check
  // In a real application, this would be more sophisticated
  return activeZones.some((zone: any) => 
    zone.zipCodes?.includes(userZipCode) || 
    zone.cities?.some((city: string) => city.toLowerCase().includes(userZipCode.toLowerCase()))
  );
};
