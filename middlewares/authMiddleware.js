// import jwt from "jsonwebtoken";


// export const protect = (req, res, next) => {
//   let token;


//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }


//   if (!token) {
//     return res.status(401).json({ message: "Not authorized" });
//   }


//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // { id, role }
//     next();
//   } catch (error) {
//     res.status(401).json({ message: "Token failed" });
//   }
// };
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import SuperAdmin from "../models/SuperAdmin.js";

/**
 * MAIN AUTHENTICATION MIDDLEWARE
 * Verifies JWT token and attaches user to req.user
 */
export const protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    let token;
    
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    
    // 2. Check if token exists
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Not authorized, no token" 
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Find user based on role
    let user = null;
    
    if (decoded.role === "SUPER_ADMIN") {
      // Find in SuperAdmin collection
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
          // SUPER_ADMIN has full access to all modules
          moduleRoles: [],
          accessibleModules: ["finance", "sales", "vendor", "companyDeck", "resource"],
          companies: [] // SUPER_ADMIN can access all companies
        };
      }
    } else {
      // Find in User collection
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

    // 5. Check if user exists
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // 6. Check if user is active
    if (!req.user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: "Your account has been deactivated. Contact Super Admin." 
      });
    }

    // 7. Proceed to next middleware/controller
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

/**
 * ROLE-BASED ACCESS MIDDLEWARE
 * Restricts access to specific roles
 */
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

/**
 * MODULE ACCESS MIDDLEWARE
 * Checks if user has access to specific module
 */
export const requireModuleAccess = (moduleName, permission = "read") => {
  return (req, res, next) => {
    // SUPER_ADMIN has access to everything
    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }

    // Check if user has the module in accessibleModules
    if (!req.user.accessibleModules || 
        !req.user.accessibleModules.includes(moduleName)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied to ${moduleName} module` 
      });
    }

    // Check specific permission if needed
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

/**
 * OWNERSHIP CHECK MIDDLEWARE
 * Checks if user owns the resource or has access
 */
export const checkOwnership = (modelName) => {
  return async (req, res, next) => {
    try {
      // SUPER_ADMIN can access everything
      if (req.user.role === "SUPER_ADMIN") {
        return next();
      }

      const resourceId = req.params.id || req.params.userId;
      
      if (!resourceId) {
        return next(); // No resource ID to check
      }

      let Model;
      switch(modelName) {
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

      // Check if user created this document
      if (document.createdBy?.userId?.toString() === req.user._id.toString()) {
        return next();
      }

      // For companies, check if user is assigned
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

      // If none of the above, check for USER role accessing their own data
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

/**
 * ACTIVATE/DEACTIVATE PERMISSION MIDDLEWARE
 * Only SUPER_ADMIN can toggle active status
 */
export const requireSuperAdminForToggle = (req, res, next) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({ 
      success: false,
      message: "Only Super Admin can activate/deactivate resources" 
    });
  }
  next();
};