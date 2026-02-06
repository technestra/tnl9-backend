import User from "../models/User.js";
import SuperAdmin from "../models/SuperAdmin.js";

export const assignModuleRole = async (req, res) => {
  try {
    const { userId, module, moduleRole, permissions } = req.body;

    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin can assign module roles" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.moduleRoles = user.moduleRoles.filter(
      role => role.module !== module
    );

    user.moduleRoles.push({
      module,
      moduleRole,
      canCreate: permissions?.create || false,
      canRead: permissions?.read || true,
      canUpdate: permissions?.update || false,
      canDelete: permissions?.delete || false,
      assignedBy: req.user.id,
      assignedAt: new Date()
    });

    user.accessibleModules = [...new Set([
      ...(user.accessibleModules || []),
      module
    ])];

    await user.save();

    res.json({
      message: `Module role assigned successfully`,
      user: {
        id: user._id,
        name: user.name,
        fixedRole: user.role,
        moduleRoles: user.moduleRoles
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeModuleRole = async (req, res) => {
  try {
    const { userId, module } = req.body;

    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Only Super Admin can remove module roles" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.moduleRoles = user.moduleRoles.filter(
      role => role.module !== module
    );

    user.accessibleModules = (user.accessibleModules || []).filter(
      m => m !== module
    );

    await user.save();

    res.json({
      message: `Module role removed successfully`,
      user: {
        id: user._id,
        name: user.name,
        moduleRoles: user.moduleRoles
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsersWithModuleRoles = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find().select("-password");

    res.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        fixedRole: user.role,
        moduleRoles: user.moduleRoles || [],
        accessibleModules: user.accessibleModules || []
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getModulePermissionsSummary = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find().select("name email role moduleRoles accessibleModules");

    const modules = ["finance", "sales", "vendor", "companyDeck", "resource"];
    const summary = {};

    modules.forEach(module => {
      summary[module] = {
        totalAssigned: 0,
        admins: [],
        editors: [],
        viewers: []
      };
    });

    users.forEach(user => {
      user.moduleRoles?.forEach(moduleRole => {
        const module = moduleRole.module;
        if (summary[module]) {
          summary[module].totalAssigned++;
          const userInfo = {
            id: user._id,
            name: user.name,
            email: user.email
          };

          switch (moduleRole.moduleRole) {
            case "admin":
              summary[module].admins.push(userInfo);
              break;
            case "editor":
              summary[module].editors.push(userInfo);
              break;
            case "viewer":
              summary[module].viewers.push(userInfo);
              break;
          }
        }
      });
    });

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};