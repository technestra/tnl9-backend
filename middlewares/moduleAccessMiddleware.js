export const checkModuleAccess = (moduleName, operation = "read") => {
  return (req, res, next) => {
    const user = req.user;

    if (user.role === "SUPER_ADMIN") {
      return next();
    }

    if (!user.accessibleModules || !user.accessibleModules.includes(moduleName)) {
      return res.status(403).json({
        message: `Access denied. You don't have ${moduleName} module access.`
      });
    }
    next();
  };
};