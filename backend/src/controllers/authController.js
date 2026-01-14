import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import User from '../models/User.js';
import { sendError, sendSuccess } from '../utils/response.js';

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';
const SALT_ROUNDS = 10;

const signAccessToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
};

const signRefreshToken = (user) => {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET not set');
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
};

const setRefreshCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const populateUser = async (userId) => {
  try {
    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', 'username profilePic role')
      .populate('following', 'username profilePic role')
      .populate('communities', 'name')
      .lean();
    return user;
  } catch (err) {
    console.error('Populate user error:', err);
    // Fallback: return user without populates
    const user = await User.findById(userId).select('-password').lean();
    return user;
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    console.log('Register attempt:', { username, email, role });

    if (!username || !email || !password) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Username, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, { status: httpStatus.CONFLICT, message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({ username, email, password: hashedPassword, role });
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    // store hashed refresh in DB for invalidation
    const hashedRt = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: hashedRt } });
    setRefreshCookie(res, refreshToken);
    const sanitizedUser = await populateUser(user._id);
    const userObj = sanitizedUser && sanitizedUser.toObject ? sanitizedUser.toObject() : sanitizedUser;
    if (userObj) userObj.name = userObj.name || userObj.username;

    return sendSuccess(res, {
      status: httpStatus.CREATED,
      message: 'User registered successfully',
      data: { user: userObj || sanitizedUser, token: accessToken },
    });
  } catch (err) {
    console.error('Register error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: err.message || 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email });

    if (!email || !password) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    const hashedRt = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: hashedRt } });
    setRefreshCookie(res, refreshToken);
    const sanitizedUser = await populateUser(user._id);
    const userObj = sanitizedUser && sanitizedUser.toObject ? sanitizedUser.toObject() : sanitizedUser;
    if (userObj) userObj.name = userObj.name || userObj.username;

    return sendSuccess(res, {
      status: httpStatus.OK,
      message: 'Login successful',
      data: { user: userObj || sanitizedUser, token: accessToken },
    });
  } catch (err) {
    console.error('Login error:', err);
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: err.message || 'Login failed' });
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'No refresh token' });
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+password +refreshTokens');
    if (!user) return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'User not found' });
    const match = await Promise.any((user.refreshTokens || []).map((rt) => bcrypt.compare(token, rt))).catch(() => false);
    if (!match) return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'Invalid refresh token' });
    const accessToken = signAccessToken(user);
    return sendSuccess(res, { data: { token: accessToken } });
  } catch (err) {
    return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'Failed to refresh token' });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (user?.refreshTokens?.length) {
          user.refreshTokens = [];
          await user.save();
        }
      } catch {}
    }
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return sendSuccess(res, { data: { logout: true } });
  } catch (err) {
    return sendError(res, { status: httpStatus.INTERNAL_SERVER_ERROR, message: 'Logout failed' });
  }
};
