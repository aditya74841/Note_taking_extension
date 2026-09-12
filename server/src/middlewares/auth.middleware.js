import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { config } from '../config/env.js';

export const verifyJWT = async (req, _res, next) => {
  try {
    const authorization = req.header('Authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : null;

    if (!token) {
      throw new ApiError(401, 'Unauthorized request: Missing token');
    }

    const decodedToken = jwt.verify(token, config.accessTokenSecret);

    const user = await User.findById(decodedToken?._id).select('-password');

    if (!user) {
      throw new ApiError(401, 'Invalid Access Token: User not found');
    }

    req.user = user;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired access token'));
  }
};
