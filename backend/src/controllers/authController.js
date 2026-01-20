import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import User from '../models/User.js';
import Community from '../models/Community.js';
import JoinRequest from '../models/JoinRequest.js';
import { sendError, sendSuccess } from '../utils/response.js';

const ACCESS_TOKEN_DURATION = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_TOKEN_DURATION = process.env.JWT_REFRESH_EXPIRES || '7d';
const PASSWORD_HASH_ROUNDS = 10;

const createAccessToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_DURATION });
};

const createRefreshToken = (user) => {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET not set');
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_DURATION });
};

const setRefreshCookie = (response, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  response.cookie('refresh_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const getUserDetails = async (userId) => {
  try {
    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', 'username profilePic role')
      .populate('following', 'username profilePic role')
      .populate('communities', 'name')
      .lean();
    if (user) {
      user.name = user.name || user.username;
    }
    return user;
  } catch (err) {
    console.error('Populate user error:', err);
    
    const user = await User.findById(userId).select('-password').lean();
    if (user) {
      user.name = user.name || user.username;
    }
    return user;
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password, role, collegeName, communityId } = req.body;

    if (email === "admin@campus.edu") {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Admin signup not allowed' });
    }

    if (!username || !email || !password || !collegeName) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Username, email, password, and college name are required' });
    }

    if (role === 'Community' && !communityId) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Community selection is required for Community role' });
    }

    if (role === 'Community' && communityId) {
      const joinRequest = await JoinRequest.findOne({
        email,
        communityId,
        status: 'accepted'
      });
      if (!joinRequest) {
        return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Join request not approved yet' });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, { status: httpStatus.CONFLICT, message: 'Email is already registered' });
    }

    const encryptedPassword = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

    const user = await User.create({ username, email, password: encryptedPassword, role, collegeName });

    if (role === 'Student' || role === 'Faculty') {
      const announcementName = `${collegeName} Announcements`;
      let community = await Community.findOne({ name: announcementName });
      if (!community) {
        const firstFaculty = await User.findOne({ role: 'Faculty', collegeName });
        if (firstFaculty) {
          community = await Community.create({
            communityId: `${collegeName.toLowerCase().replace(/\s+/g, '-')}-announcements-${Math.random().toString(36).substr(2, 9)}`,
            name: announcementName,
            admin: firstFaculty._id,
            members: [firstFaculty._id],
            isAnnouncement: true,
            isFacultyChannel: false,
          });
        }
      }
      if (community && !community.members.includes(user._id)) {
        community.members.push(user._id);
        await community.save();
        await User.findByIdAndUpdate(user._id, { $addToSet: { communities: community._id } });
      }
    }

    if (role === 'Community' && communityId) {
      const community = await Community.findById(communityId);
      if (community && !community.members.includes(user._id)) {
        community.members.push(user._id);
        await community.save();
        await User.findByIdAndUpdate(user._id, { $addToSet: { communities: community._id } });
      }
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    const encryptedRefreshToken = await bcrypt.hash(refreshToken, PASSWORD_HASH_ROUNDS);
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: encryptedRefreshToken } });
    setRefreshCookie(res, refreshToken);
    const sanitizedUser = await getUserDetails(user._id);
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

    if (!email || !password) {
      return sendError(res, { status: httpStatus.BAD_REQUEST, message: 'Email and password are required' });
    }

    
    if (email === "admin@campus.edu" && password === "admin123") {
      const adminUser = {
        _id: "admin",
        username: "Admin",
        email: "admin@campus.edu",
        role: "admin",
        name: "Admin",
        userType: "admin"
      };

      const accessToken = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_DURATION });
      const refreshToken = jwt.sign({ id: adminUser._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_DURATION });
      setRefreshCookie(res, refreshToken);

      return sendSuccess(res, {
        status: httpStatus.OK,
        message: 'Login successful',
        data: { user: adminUser, token: accessToken },
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'Invalid credentials' });
    }

    if (user.role === 'Community') {
      const joinRequest = await JoinRequest.findOne({
        userId: user._id,
        status: 'accepted'
      });
      if (!joinRequest) {
        return sendError(res, { status: httpStatus.UNAUTHORIZED, message: 'Join request not approved yet' });
      }
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    const encryptedRefreshToken = await bcrypt.hash(refreshToken, PASSWORD_HASH_ROUNDS);
    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: encryptedRefreshToken } });
    setRefreshCookie(res, refreshToken);
    const sanitizedUser = await getUserDetails(user._id);
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

export const refresh = async (request, response) => {
  try {
    const token = request.cookies?.refresh_token;
    if (!token) return sendError(response, { status: httpStatus.UNAUTHORIZED, message: 'No refresh token' });
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+password +refreshTokens');
    if (!user) return sendError(response, { status: httpStatus.UNAUTHORIZED, message: 'User not found' });
    const match = await Promise.any((user.refreshTokens || []).map((rt) => bcrypt.compare(token, rt))).catch(() => false);
    if (!match) return sendError(response, { status: httpStatus.UNAUTHORIZED, message: 'Invalid refresh token' });
    const accessToken = createAccessToken(user);
    return sendSuccess(response, { data: { token: accessToken } });
  } catch (err) {
    return sendError(response, { status: httpStatus.UNAUTHORIZED, message: 'Failed to refresh token' });
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
