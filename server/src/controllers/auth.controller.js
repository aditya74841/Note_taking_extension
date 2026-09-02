import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, 'User with this email already exists');
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
    });

    const accessToken = user.generateAccessToken();

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          user: { _id: user._id, email: user.email },
          token: accessToken,
        },
        'User registered successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError(404, 'User does not exist');
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid user credentials');
    }

    const accessToken = user.generateAccessToken();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: { _id: user._id, email: user.email },
          token: accessToken,
        },
        'User logged in successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, 'Current user retrieved successfully'));
  } catch (error) {
    next(error);
  }
};
