export const checkModuleAccess = (moduleName, operation = "read") => {
  return (req, res, next) => {
    const user = req.user;

    // SUPER_ADMIN ko full access
    if (user.role === "SUPER_ADMIN") {
      return next();
    }

    // For other users, check if they have the module in their accessibleModules
    if (!user.accessibleModules || !user.accessibleModules.includes(moduleName)) {
      return res.status(403).json({
        message: `Access denied. You don't have ${moduleName} module access.`
      });
    }

    next();
  };
};