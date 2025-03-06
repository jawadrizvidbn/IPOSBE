exports.isAdmin = (req, res, next) => {
  const userRole = req.user && req.user.role;

  if (userRole === "admin") {
    next();
  } else {
    res.status(403).send({ message: "Require Admin Role!" });
  }
};

exports.checkAdminOrPermission = (requiredPermissions) => {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;

    if (userRole === "admin") {
      next();
    } else {
      const userPermissions = (req.user && req.user.permissions) || [];
      console.log("User Role:", userRole);
      
      console.log("User Permissions:", userPermissions);
      console.log("Required Permissions:", requiredPermissions);

      // Ensure userPermissions is an array
      let parsedUserPermissions = userPermissions;

      if (typeof userPermissions === "string") {
        try {
          parsedUserPermissions = JSON.parse(userPermissions);
        } catch (error) {
          console.error("Error parsing user permissions:", error);
          parsedUserPermissions = [];
        }
      }

      const hasRequiredPermissions = requiredPermissions.every((permission) =>
        parsedUserPermissions.includes(permission)
      );

      if (hasRequiredPermissions) {
        next();
      } else {
        res.status(403).send({ message: "Insufficient permissions" });
      }
    }
  };
};
