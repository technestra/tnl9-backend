import EmployeeDocument from "../models/EmployeeDocument.js";
import EmployeeProfile from "../models/EmployeeProfile.js";
import cloudinary from "../utils/cloudinary.js";
import crypto from "crypto";

export const generateCloudinarySignature = (req, res) => {
  const { folder } = req.query;

  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder
    },
    process.env.CLOUDINARY_SECRET
  );

  res.json({
    cloudName: process.env.CLOUDINARY_NAME,
    apiKey: process.env.CLOUDINARY_KEY,
    timestamp,
    signature
  });
};


export const uploadDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await EmployeeProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    let docRecord = await EmployeeDocument.findOne({ user: userId });

    if (docRecord?.documentsLocked) {
      return res.status(403).json({ message: "Documents are locked" });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No documents uploaded" });
    }

    if (!docRecord) {
      docRecord = new EmployeeDocument({
        user: userId,
        employeeProfile: profile._id
      });
    }

    for (const field of Object.keys(req.files)) {
      const file = req.files[field]?.[0];
      if (!file) continue;

      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        {
          folder: `employees/${profile._id}/${field}`,
          resource_type: "auto"
        }
      );

      docRecord.documents[field] = {
        url: result.secure_url,
        publicId: result.public_id
      };
    }

    docRecord.documentsLocked = true;
    docRecord.unlockedBySuperAdmin = false;

    await docRecord.save();

    res.json({ message: "Documents uploaded and locked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




/* ================= VIEW DOCUMENTS (SUPER ADMIN ONLY) ================= */
export const getEmployeeDocuments = async (req, res) => {
  try {
    const docs = await EmployeeDocument.findOne({ user: req.params.userId })
      .populate("user", "name email");

    if (!docs) {
      return res.status(404).json({ message: "No documents found" });
    }

    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UNLOCK DOCUMENTS (SUPER ADMIN) ================= */
export const unlockDocuments = async (req, res) => {
  try {
    const docs = await EmployeeDocument.findOne({ user: req.params.userId });

    if (!docs) {
      return res.status(404).json({ message: "Documents not found" });
    }

    docs.documentsLocked = false;
    docs.unlockedBySuperAdmin = true;

    await docs.save();

    res.json({ message: "Documents unlocked for re-upload" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const saveUploadedUrls = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await EmployeeProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    const existing = await EmployeeDocument.findOne({ user: userId });
    if (existing?.documentsLocked) {
      return res.status(403).json({ message: "Documents are locked" });
    }

    await EmployeeDocument.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        employeeProfile: profile._id,
        documents: req.body.documents,
        documentsLocked: true,
        unlockedBySuperAdmin: false
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Documents saved and locked" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
