import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Company from "../models/Company.js";

export const createUserBySuperAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, role, companyIds = [] } = req.body;

    if (!['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      createdBy: 'SUPER_ADMIN'
    });

    if (companyIds.length) {
      for (const companyId of companyIds) {
        const company = await Company.findById(companyId);
        if (!company) continue;

        if (role === 'ADMIN') {
          company.assignedAdmins.addToSet(user._id);
        } else {
          company.assignedUsers.addToSet(user._id);
        }
        await company.save();

        user.companies.addToSet(company._id);
      }
      await user.save();
    }

    const safeUser = await User.findById(user._id).select("-password");
    res.status(201).json({ message: "User created", user: safeUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'USER',
      createdBy: 'ADMIN'
    });

    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    console.log("📊 getMe called for user ID:", req.user.id);
    if (req.user.role === "SUPER_ADMIN") {
      console.log("👑 Fetching SUPER_ADMIN data");
      return res.json({
        _id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: "SUPER_ADMIN",
        isActive: true,
        accessibleModules: ["finance", "sales", "vendor", "companyDeck", "resource"],
        moduleRoles: []
      });
    }

    console.log("👤 Fetching regular user data");
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("companies", "companyName");

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log("✅ User found:", user.email);
    res.json(user);

  } catch (err) {
    console.error("❌ Error in getMe:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error in getMe"
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = false;
    user.companies = [];
    await user.save();

    await Company.updateMany({}, {
      $pull: {
        assignedAdmins: user._id,
        assignedUsers: user._id
      }
    });

    res.json({ message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  const users = await User.find().select("name email role isActive");
  res.json(users);
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? "Activated" : "Deactivated"}`,
      isActive: user.isActive
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
