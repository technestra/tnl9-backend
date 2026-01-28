import Company from "../models/Company.js";
import User from "../models/User.js";

export const assignUserToCompany = async (req, res) => {
try {
const { companyId, userId } = req.body;

const company = await Company.findById(companyId);
const user = await User.findById(userId);

if (!company || !user) {
return res.status(404).json({ message: "Company or User not found" });
}

if (user.role === "ADMIN") {
company.assignedAdmins.addToSet(user._id);
} else {
company.assignedUsers.addToSet(user._id);
}

await company.save();

await User.findByIdAndUpdate(user._id, {
$addToSet: { companies: company._id }
});


res.json({ message: "User assigned to company" });
} catch (error) {
res.status(500).json({ message: error.message });
}
};

export const removeUserFromCompany = async (req, res) => {
try {
const { companyId, userId } = req.body;

const company = await Company.findById(companyId);
const user = await User.findById(userId);

if (!company || !user) {
return res.status(404).json({ message: "Company or User not found" });
}

if (user.role === "ADMIN") {
company.assignedAdmins.pull(user._id);
} else {
company.assignedUsers.pull(user._id);
}

await company.save();

await User.findByIdAndUpdate(user._id, {
$pull: { companies: company._id }
});

res.json({ message: "User removed from company" });
} catch (error) {
res.status(500).json({ message: error.message });
}
};