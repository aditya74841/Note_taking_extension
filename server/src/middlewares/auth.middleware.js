import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';

export const verifyJWT = async (req, _, next) => {
  try {
    const token =
      req.header('Authorization')?.replace('Bearer ', '') ||
      req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(401, 'Unauthorized request: Missing token');
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select('-password');

    if (!user) {
      throw new ApiError(401, 'Invalid Access Token: User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, error?.message || 'Invalid or expired token'));
  }
};
