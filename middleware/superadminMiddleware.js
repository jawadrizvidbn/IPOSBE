const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const LZString = require('lz-string');

const checkSuperadmin = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    console.log('Authorization header missing');
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  try {
    const tokenParts = token.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      console.log('Invalid token format');
      return res.status(401).json({ message: 'Invalid token format' });
    }

    const decoded = jwt.verify(tokenParts[1], 'your-secret-key'); // Extract token from header
    console.log('Decoded token:', decoded); // Log decoded token
    req.userId = decoded.id;

    // Decompress permissions before parsing
    const decompressedPermissions = LZString.decompressFromBase64(decoded.permissions);
    if (!decompressedPermissions) {
      console.log('Failed to decompress permissions');
      return res.status(401).json({ message: 'Invalid permissions format' });
    }

    req.permissions = JSON.parse(decompressedPermissions); // Assuming permissions are JSON string
    console.log('User permissions:', req.permissions);

    const user = await User.findByPk(req.userId);

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User role:', user.role);

    // Check if the user is a superadmin
    if (user.role === 'superadmin') {
      req.superadmin = user; // Correcting variable name
      console.log('User is a superadmin');
      return next(); // Allow access for superadmin
    }

    // If not a superadmin, ensure permissions are set
    if (!req.permissions) {
      console.log('Permissions not found in token');
      return res.status(401).json({ message: 'Permissions not found in token' });
    }

    // Set user permissions in request object
    req.userPermissions = req.permissions.userPermissions || []; // Ensure userPermissions is an array
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = checkSuperadmin;
