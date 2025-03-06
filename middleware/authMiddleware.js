// authMiddleware.js

const jwt = require("jsonwebtoken");
const config = require("../config/config");

function verifyToken(req, res, next) {
  // let token = req.headers["x-access-token"];
  const token = req.headers.authorization;
  console.log("req.headers Authorization: ", token);

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      console.error("JWT Verification Error:", err);
      return res.status(401).send({ message: "Unauthorized!" });
    }

    console.log("Decoded Token:", decoded);

    // Ensure that the decoded token contains role and permissions
    if (!decoded.role || !decoded.permissions) {
      return res.status(401).send({ message: "Invalid token format!" });
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
      password: decoded.password,
      role: decoded.role,
      permissions: decoded.permissions,
    };

    console.log("req.user:", req.user);

    next();
  });
}

module.exports = {
  verifyToken: verifyToken,
};
