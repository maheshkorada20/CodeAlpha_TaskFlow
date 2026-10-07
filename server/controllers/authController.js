const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'user', adminKey, adminAccessCode } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email address already exists',
    });
  }

  const isFirstUser = (await User.countDocuments({})) === 0;
  let globalRole = 'user';

  if (role === 'admin' || email === 'admin@taskflow.com' || isFirstUser) {
    // If not first user or default admin email, verify admin secret key
    if (!isFirstUser && email !== 'admin@taskflow.com') {
      const validKey = process.env.ADMIN_ACCESS_CODE || process.env.ADMIN_KEY || 'admin123';
      const providedKey = adminAccessCode || adminKey;
      if (!providedKey || providedKey.trim() !== validKey) {
        return res.status(403).json({
          success: false,
          message: 'Invalid Admin Access Code. Administrator registration is restricted.',
        });
      }
    }
    globalRole = 'admin';
  }

  const user = await User.create({
    name,
    email,
    password,
    globalRole,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        globalRole: user.globalRole,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password, adminAccessCode, portalType } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.',
    });
  }

  const validAccessCode = process.env.ADMIN_ACCESS_CODE || process.env.ADMIN_KEY || 'admin123';

  // If logging in as Administrator or submitting adminAccessCode
  if (portalType === 'admin' || adminAccessCode) {
    if (!adminAccessCode || adminAccessCode.trim() !== validAccessCode) {
      return res.status(403).json({
        success: false,
        message: 'Invalid Admin Access Code. You must provide the valid access code to log in as Administrator.',
      });
    }

    // Whoever knows the admin access code, those people are admins
    if (user.globalRole !== 'admin') {
      user.globalRole = 'admin';
      await user.save();
    }
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        globalRole: user.globalRole,
        createdAt: user.createdAt,
      },
      token,
    },
  });
});

// @desc    Logout user / clear token on client
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
    data: {},
  });
});

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user,
    },
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, avatar } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user,
    },
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
    data: {},
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
