export const allowRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions."
      });
    }

    next();
  };
};

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;

    if (decoded.role === "SUPER_ADMIN") {
      user = await SuperAdmin.findById(decoded.id)
        .select("-password")
        .lean();

      if (user) {
        req.user = {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          role: "SUPER_ADMIN",
          isActive: user.isActive,
          moduleRoles: [],
          accessibleModules: ["finance", "sales", "vendor", "companyDeck", "resource"],
          companies: []
        };
      }
    } else {
      user = await User.findById(decoded.id)
        .select("-password")
        .populate("companies", "companyName")
        .lean();

      if (user) {
        req.user = {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          companies: user.companies || [],
          moduleRoles: user.moduleRoles || [],
          accessibleModules: user.accessibleModules || []
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact Super Admin."
      });
    }

    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not allowed.`
      });
    }

    next();
  };
};

export const requireModuleAccess = (moduleName, permission = "read") => {
  return (req, res, next) => {
    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }

    if (!req.user.accessibleModules ||
      !req.user.accessibleModules.includes(moduleName)) {
      return res.status(403).json({
        success: false,
        message: `Access denied to ${moduleName} module`
      });
    }

    if (permission !== "read") {
      const moduleRole = req.user.moduleRoles?.find(
        mr => mr.module === moduleName
      );

      if (!moduleRole) {
        return res.status(403).json({
          success: false,
          message: `No permissions set for ${moduleName} module`
        });
      }

      const hasPermission =
        (permission === "create" && moduleRole.canCreate) ||
        (permission === "update" && moduleRole.canUpdate) ||
        (permission === "delete" && moduleRole.canDelete);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `No ${permission} permission for ${moduleName} module`
        });
      }
    }

    next();
  };
};

export const checkOwnership = (modelName) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === "SUPER_ADMIN") {
        return next();
      }

      const resourceId = req.params.id || req.params.userId;

      if (!resourceId) {
        return next();
      }

      let Model;
      switch (modelName) {
        case 'Company':
          Model = (await import('../models/Company.js')).default;
          break;
        case 'ContactPerson':
          Model = (await import('../models/ContactPerson.js')).default;
          break;
        case 'Suspect':
          Model = (await import('../models/Suspect.js')).default;
          break;
        case 'Prospect':
          Model = (await import('../models/Prospect.js')).default;
          break;
        case 'Lead':
          Model = (await import('../models/Lead.js')).default;
          break;
        case 'User':
          Model = User;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid model specified"
          });
      }

      const document = await Model.findById(resourceId);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: `${modelName} not found`
        });
      }

      if (document.createdBy?.userId?.toString() === req.user._id.toString()) {
        return next();
      }
      if (modelName === 'Company') {
        const isAssignedAdmin = document.assignedAdmins?.some(
          adminId => adminId.toString() === req.user._id.toString()
        );

        const isAssignedUser = document.assignedUsers?.some(
          userId => userId.toString() === req.user._id.toString()
        );

        if (isAssignedAdmin || isAssignedUser) {
          return next();
        }
      }

      if (modelName === 'User' && document._id.toString() === req.user._id.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this resource"
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

export const requireSuperAdminForToggle = (req, res, next) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only Super Admin can activate/deactivate resources"
    });
  }
  next();
};