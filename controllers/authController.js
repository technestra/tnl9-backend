import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import SuperAdmin from "../models/SuperAdmin.js";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await SuperAdmin.findOne({ email });
    let role = "SUPER_ADMIN";

    if (!user) {
      user = await User.findOne({ email, isActive: true });
      if (!user) return res.status(404).json({ message: "Invalid credentials" });

      role = user.role;
    }

    if (!user.isActive) {
  return res.status(403).json({
    message: "Your account is deactivated. Contact Super Admin."
  });
}

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
