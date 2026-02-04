import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import SuperAdmin from "../models/SuperAdmin.js";

export const createSuperAdmin = async (req, res) => {
try {
const existing = await SuperAdmin.findOne();
if (existing) {
return res.status(403).json({ message: "Super Admin already exists" });
}
const { name, email, password } = req.body;
const hashedPassword = await bcrypt.hash(password, 10);
const superAdmin = await SuperAdmin.create({
name,
email,
password: hashedPassword
});

res.status(201).json({ message: "Super Admin created", superAdmin });
} catch (error) {
res.status(500).json({ message: error.message });
}
};

export const loginSuperAdmin = async (req, res) => {
try {
const { email, password } = req.body;

const superAdmin = await SuperAdmin.findOne({ email });
if (!superAdmin) {
return res.status(404).json({ message: "Invalid credentials" });
}

const isMatch = await bcrypt.compare(password, superAdmin.password);
if (!isMatch) {
return res.status(401).json({ message: "Invalid credentials" });
}

const token = jwt.sign(
{ id: superAdmin._id, role: superAdmin.role },
process.env.JWT_SECRET,
{ expiresIn: "1d" }
);

res.json({ token });
} catch (error) {
res.status(500).json({ message: error.message });
}
};