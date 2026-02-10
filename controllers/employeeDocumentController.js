import EmployeeDocument from "../models/EmployeeDocument.js";
import EmployeeProfile from "../models/EmployeeProfile.js";
import cloudinary from "../utils/cloudinary.js";
import crypto from "crypto";

export const generateCloudinarySignature = (req, res) => {
  const { folder } = req.query;

  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
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
    console.log("Upload request started. Files received:", req.files ? Object.keys(req.files) : "No files");

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No documents uploaded" });
    }

    if (!process.env.CLOUDINARY_KEY) {
      throw new Error("Cloudinary API key missing in .env file");
    }

    const userId = req.user.id;

    const profile = await EmployeeProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    let docRecord = await EmployeeDocument.findOne({ user: userId });

    if (!docRecord) {
      docRecord = new EmployeeDocument({
        user: userId,
        employeeProfile: profile._id,
        documents: {}
      });
    }

    const updatedDocs = { ...docRecord.documents };
    let hasNewUpload = false;

    for (const field of Object.keys(req.files)) {
      const file = req.files[field]?.[0];
      if (!file) continue;

      hasNewUpload = true;

      console.log(`Uploading ${field}:`, file.originalname, file.size);

      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
        {
          folder: `employees/${profile._id}/${field}`,
          resource_type: "auto"
        }
      );

      console.log(`Upload success for ${field}:`, result.secure_url);

      updatedDocs[field] = {
        url: result.secure_url,
        publicId: result.public_id,
        uploadedAt: new Date(),
        locked: true
      };
    }

    if (!hasNewUpload) {
      return res.status(400).json({ message: "No new documents uploaded" });
    }

    docRecord.documents = updatedDocs;
    docRecord.unlockedBySuperAdmin = false;

    await docRecord.save();

    res.json({
      message: "Uploaded documents locked",
      documents: docRecord.documents
    });
  } catch (error) {
    console.error("UploadDocuments Error:", error.stack);
    res.status(500).json({
      message: "Upload failed on server",
      error: error.message
    });
  }
};

export const getEmployeeDocuments = async (req, res) => {
  try {
    const docs = await EmployeeDocument.findOne({ user: req.params.userId })
      .populate("user", "name email");

    if (!docs) {
      return res.status(200).json({
        user: { name: "User", email: "" },
        unlockedBySuperAdmin: false,
        message: "No documents uploaded yet"
      });
    }

    res.json(docs);
  } catch (error) {
    console.error("Get Employee Documents Error:", error);
    res.status(500).json({ message: "Server error while fetching documents" });
  }
};

export const unlockDocuments = async (req, res) => {
  try {
    const docs = await EmployeeDocument.findOne({ user: req.params.userId });

    if (!docs) {
      return res.status(404).json({ message: "Documents not found" });
    }

    Object.keys(docs.documents).forEach(field => {
      if (docs.documents[field]) {
        docs.documents[field].locked = false;
      }
    });

    docs.unlockedBySuperAdmin = true;
    await docs.save();

    res.json({ message: "All documents unlocked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const saveUploadedUrls = async (req, res) => {
  try {
    const userId = req.user.id;
    const { field, url, publicId } = req.body;

    if (!field || !url || !publicId) {
      return res.status(400).json({ message: "Missing document data" });
    }

    const profile = await EmployeeProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    let docs = await EmployeeDocument.findOne({ user: userId });

    if (!docs) {
      docs = new EmployeeDocument({
        user: userId,
        employeeProfile: profile._id,
        documents: {}
      });
    }

    if (docs.documents?.[field]?.locked === true) {
      return res.status(403).json({
        message: `${field} is locked. Contact Super Admin.`
      });
    }

    docs.documents[field] = {
      url,
      publicId,
      uploadedAt: new Date(),
      locked: true
    };

    docs.unlockedBySuperAdmin = false;

    await docs.save();

    res.json({
      message: `${field} uploaded and locked successfully`,
      document: docs.documents[field]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDocumentStatus = async (req, res) => {
  try {
    const doc = await EmployeeDocument.findOne({ user: req.user.id });

    if (!doc) {
      return res.json({ documents: {} });
    }
    const status = {};
    Object.keys(doc.documents).forEach(field => {
      status[field] = {
        locked: doc.documents[field]?.locked ?? false,
        url: doc.documents[field]?.url ?? null
      };
    });

    res.json({
      documents: status,
      unlockedBySuperAdmin: doc.unlockedBySuperAdmin
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch document status" });
  }
};

export const unlockSingleDocument = async (req, res) => {
  try {
    const { userId, field } = req.params;

    const docs = await EmployeeDocument.findOne({ user: userId });

    if (!docs || !docs.documents[field]) {
      return res.status(404).json({ message: "Document not found" });
    }

    docs.documents[field].locked = false;
    docs.unlockedBySuperAdmin = true;

    await docs.save();

    res.json({ message: `${field} unlocked successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};