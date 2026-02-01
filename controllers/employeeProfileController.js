import cloudinary from "../utils/cloudinary.js";
import EmployeeProfile from "../models/EmployeeProfile.js";

export const createEmployeeProfile = async (req, res) => {
  try {
    if (req.user.role === "SUPER_ADMIN") {
      return res
        .status(403)
        .json({ message: "Super Admin cannot have employee profile" });
    }

    const existing = await EmployeeProfile.findOne({ user: req.user.id });
    if (existing) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const profile = await EmployeeProfile.create({
      user: req.user.id,
      employeeId: `EMP-${Date.now()}`,
      employeeCode: `EC-${Math.floor(100000 + Math.random() * 900000)}`
    });

    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEmployeeProfile = async (req, res) => {
  try {
    if (req.user.role === "SUPER_ADMIN") {
      return res
        .status(403)
        .json({ message: "Super Admin cannot update employee profile" });
    }

    let profile = await EmployeeProfile.findOne({ user: req.user.id });

    if (!profile) {
      profile = await EmployeeProfile.create({
        user: req.user.id,
        employeeId: `EMP-${Date.now()}`,
        employeeCode: `EC-${Math.floor(100000 + Math.random() * 900000)}`
      });
    }

    if (req.body.panNumber !== undefined) {
      if (profile.panLocked) {
        return res.status(400).json({ message: "PAN already locked" });
      }
      profile.panNumber = req.body.panNumber.toUpperCase();
      profile.panLocked = true;
    }

    if (req.body.aadhaarNumber !== undefined) {
      if (profile.aadhaarLocked) {
        return res.status(400).json({ message: "Aadhaar already locked" });
      }
      profile.aadhaarNumber = req.body.aadhaarNumber;
      profile.aadhaarLocked = true;
    }

    const editableFields = [
      "dob",
      "gender",
      "maritalStatus",
      "bloodGroup",
      "nationality",
      "personalEmail",
      "personalMobile",
      "currentAddress",
      "permanentAddress",
      "designation",
      "department",
      "employmentType",
      "workLocation",
      "skills",
      "internalRole"
    ];

    editableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const uploadPhoto = async (req, res) => {
  try {
    const result = await cloudinary.v2.uploader.upload(req.file.path, {
      folder: "employees"
    });

    const profile = await EmployeeProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        photo: {
          url: result.secure_url,
          publicId: result.public_id
        }
      },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// export const getMyProfile = async (req, res) => {
//   try {
//     const profile = await EmployeeProfile.findOne({ user: req.user.id })
//       .populate("user", "name email role");

//     if (!profile) {
//       return res.status(404).json({ message: "Profile not found" });
//     }

//     res.json(profile);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
export const getMyProfile = async (req, res) => {
  try {
    let profile = await EmployeeProfile.findOne({ user: req.user.id })
      .populate("user", "name email role");

    // 🔥 AUTO CREATE PROFILE IF NOT EXISTS
    if (!profile) {
      profile = await EmployeeProfile.create({
        user: req.user.id,
        employeeId: `EMP-${Date.now()}`,
        employeeCode: `EC-${Math.floor(100000 + Math.random() * 900000)}`
      });

      profile = await EmployeeProfile.findById(profile._id)
        .populate("user", "name email role");
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




export const getEmployeeProfileById = async (req, res) => {
  try {
    const profile = await EmployeeProfile.findOne({ user: req.params.userId })
      .populate("user", "name email role isActive");

    if (!profile) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
