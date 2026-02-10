import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import SuperAdmin from "../models/SuperAdmin.js";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    let superAdmin = await SuperAdmin.findOne({ email, isActive: true });
    if (superAdmin) {
      const isMatch = await bcrypt.compare(password, superAdmin.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign(
        { 
          id: superAdmin._id, 
          role: "SUPER_ADMIN" 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: "1d" }
      );
      return res.json({
        token,
        user: {
          _id: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "SUPER_ADMIN"
        }
      });
    }
    let user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(404).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        moduleRoles: user.moduleRoles || [],
        accessibleModules: user.accessibleModules || []
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};