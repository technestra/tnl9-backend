import jwt from "jsonwebtoken";


export const protect = (req, res, next) => {
  let token;


  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }


  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    res.status(401).json({ message: "Token failed" });
  }
};


// Update login response to include module info
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

    // Prepare response
    const response = {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role,
        // For regular users, include module info
        ...(role !== "SUPER_ADMIN" && {
          moduleRoles: user.moduleRoles || [],
          accessibleModules: user.accessibleModules || []
        })
      }
    };

    res.json(response);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};