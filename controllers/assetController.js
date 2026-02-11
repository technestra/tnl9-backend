import Asset from "../models/Asset.js";
import cloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";

// @desc    Get all assets (with trashed filter)
// @route   GET /api/assets
// @access  Private
export const getAllAssets = async (req, res) => {
  try {
    const { company, category, status, search, trashed } = req.query;

    let query = {};

    // Soft-delete filter
    if (trashed === 'true') {
      query.isTrashed = true;
    } else if (trashed === 'false' || !trashed) {
      query.isTrashed = false;
    }

    // Filter by company
    if (company && company !== 'all') {
      query.company = company;
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search functionality
    if (search && search.trim()) {
      query.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { serial: { $regex: search, $options: 'i' } },
        { asset_tag: { $regex: search, $options: 'i' } },
        { assigned_to: { $regex: search, $options: 'i' } }
      ];
    }

    const assets = await Asset.find(query)
      .sort({ createdAt: -1 })
    // .populate('created_by', 'name email')
    // .populate('updated_by', 'name email');

    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (error) {
    console.error('Get all assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const trashAsset = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid asset ID'
      });
    }

    const asset = await Asset.findById(id).session(session);

    if (!asset) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.isTrashed) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Asset is already in trash'
      });
    }

    asset.isTrashed = true;
    asset.status = 'available';
    asset.assigned_to = null;
    asset.assigned_date = null;
    asset.return_date = new Date();
    asset.updated_by = req.user?._id || null;

    asset.history.push({
      action: 'trashed',
      date: new Date(),
      remarks: 'Moved to trash',
      performed_by: req.user?._id || null
    });

    await asset.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Asset moved to trash successfully',
      data: {
        id: asset._id,
        brand: asset.brand,
        model: asset.model,
        serial: asset.serial
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Trash asset error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to move asset to trash',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const restoreAsset = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid asset ID'
      });
    }

    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (!asset.isTrashed) {
      return res.status(400).json({
        success: false,
        message: 'Asset is not in trash'
      });
    }

    asset.isTrashed = false;
    asset.updated_by = req.user?._id || null;

    asset.history.push({
      action: 'restored',
      date: new Date(),
      remarks: 'Restored from trash',
      performed_by: req.user?._id || null
    });

    await asset.save();

    res.status(200).json({
      success: true,
      message: 'Asset restored successfully',
      data: asset
    });
  } catch (error) {
    console.error('Restore asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore asset',
      error: error.message
    });
  }
};

// @desc    Permanently delete asset
// @route   DELETE /api/assets/:id/permanent
// @access  Private (Admin only)
export const deleteAssetPermanently = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid asset ID'
      });
    }

    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check if asset is in trash
    if (!asset.isTrashed) {
      return res.status(400).json({
        success: false,
        message: 'Asset must be in trash before permanent deletion'
      });
    }

    if (asset.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(asset.cloudinary_id);
      } catch (cloudinaryError) {
        console.warn('Cloudinary deletion warning:', cloudinaryError.message);
      }
    }

    const assetInfo = {
      brand: asset.brand,
      model: asset.model,
      serial: asset.serial
    };

    await asset.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Asset permanently deleted',
      data: assetInfo
    });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete asset',
      error: error.message
    });
  }
};


// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new asset
// @route   POST /api/assets
// @access  Private (Admin only)
export const createAsset = async (req, res) => {
  try {
    // ✅ Normalize GST & Total (important)
    if (req.body.gst === '' || req.body.gst === undefined) {
      req.body.gst = null;
    }

    if (req.body.total_cost === '' || req.body.total_cost === undefined) {
      req.body.total_cost = null;
    }

    // ✅ Optional backend safety calculation
    if (req.body.purchase_cost && req.body.gst !== null) {
      const cost = Number(req.body.purchase_cost);
      const gst = Number(req.body.gst);

      req.body.total_cost = cost + (cost * gst) / 100;
    }

    const assetData = {
      ...req.body,
      created_by: req.user?.id,
      history: [
        {
          action: 'created',
          date: new Date()
        }
      ]
    };

    // ✅ Cloudinary image upload
    if (req.body.photo && req.body.photo.startsWith('data:image')) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.body.photo, {
          folder: 'tnl-assets',
          resource_type: 'image'
        });

        assetData.photo = uploadResult.secure_url;
        assetData.cloudinary_id = uploadResult.public_id;
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        delete assetData.photo;
      }
    }

    const asset = await Asset.create(assetData);

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: asset
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Asset with this serial number already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: 'Failed to create asset',
      error: error.message
    });
  }
};


// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private (Admin only)
export const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Handle Cloudinary image upload if new photo is provided
    if (req.body.photo && req.body.photo.startsWith('data:image')) {
      try {
        if (asset.cloudinary_id) {
          await cloudinary.uploader.destroy(asset.cloudinary_id);
        }

        const uploadResult = await cloudinary.uploader.upload(req.body.photo, {
          folder: 'tnl-assets',
          resource_type: 'image'
        });

        req.body.photo = uploadResult.secure_url;
        req.body.cloudinary_id = uploadResult.public_id;
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        delete req.body.photo;
      }
    }

    // Add update to history
    asset.history.push({
      action: 'updated',
      date: new Date()
    });

    Object.assign(asset, req.body);
    asset.updated_by = req.user?.id;

    await asset.save();

    res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      data: asset
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update asset',
      error: error.message
    });
  }
};

// ... [rest of your existing functions] ...
// @desc    Assign asset to employee
// @route   POST /api/assets/:id/assign
// @access  Private (Admin only)
export const assignAsset = async (req, res) => {
  try {
    const { assigned_to, assigned_date } = req.body;

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    asset.assigned_to = assigned_to;
    asset.assigned_date = assigned_date || new Date();
    asset.status = 'assigned';
    asset.updated_by = req.user?.id;

    asset.history.push({
      action: 'assigned',
      to: assigned_to,
      date: asset.assigned_date
    });

    await asset.save();

    res.status(200).json({
      success: true,
      message: 'Asset assigned successfully',
      data: asset
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to assign asset',
      error: error.message
    });
  }
};

// @desc    Return asset
// @route   POST /api/assets/:id/return
// @access  Private (Admin only)
export const returnAsset = async (req, res) => {
  try {
    const { return_date, return_condition, return_remarks } = req.body;

    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    asset.return_date = return_date || new Date();
    asset.return_condition = return_condition;
    asset.return_remarks = return_remarks;
    asset.updated_by = req.user?.id;

    asset.history.push({
      action: 'returned',
      date: asset.return_date,
      condition: return_condition,
      remarks: return_remarks
    });

    asset.assigned_to = null;
    asset.assigned_date = null;
    asset.status = 'available';

    await asset.save();

    res.status(200).json({
      success: true,
      message: 'Asset returned successfully',
      data: asset
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to return asset',
      error: error.message
    });
  }
};

// @desc    Get asset statistics
// @route   GET /api/assets/stats
// @access  Private
export const getAssetStats = async (req, res) => {
  try {
    const totalAssets = await Asset.countDocuments();
    const assignedAssets = await Asset.countDocuments({ status: 'assigned' });
    const availableAssets = await Asset.countDocuments({ status: 'available' });

    const assetsByCategory = await Asset.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const assetsByCompany = await Asset.aggregate([
      {
        $group: {
          _id: '$company',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalAssets,
        assigned: assignedAssets,
        available: availableAssets,
        byCategory: assetsByCategory,
        byCompany: assetsByCompany
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
};