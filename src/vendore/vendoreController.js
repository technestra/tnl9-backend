import VendorCompany from "./vendoreCompany.js";
import VendorContact from "./vendoreContact.js";
import VendorResource from "./vendoreResource.js";

// ---------- Vendor Company ----------
export const createVendorCompany = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const company = new VendorCompany(data);
    await company.save();
    res.status(201).json({ success: true, data: company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getVendorCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, ...filters } = req.query;
    const query = { ...filters };

    if (search) {
      query.$or = [
        { ownerName: { $regex: search, $options: "i" } },
        { vendorId: { $regex: search, $options: "i" } },
        { website: { $regex: search, $options: "i" } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: "createdBy updatedBy", // if needed
    };

    const companies = await VendorCompany.paginate?.(query, options) || 
      await VendorCompany.find(query).limit(limit).skip((page-1)*limit).sort({createdAt:-1});

    res.json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorCompanyById = async (req, res) => {
  try {
    const company = await VendorCompany.findById(req.params.id)
      .populate("createdBy updatedBy");
    if (!company) {
      return res.status(404).json({ success: false, message: "Vendor company not found" });
    }
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVendorCompany = async (req, res) => {
  try {
    const company = await VendorCompany.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: "Vendor company not found" });
    }
    Object.assign(company, req.body);
    company.updatedBy = req.user._id;
    await company.save();
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteVendorCompany = async (req, res) => {
  try {
    const company = await VendorCompany.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: "Vendor company not found" });
    }
    await company.softDelete(req.user._id);
    res.json({ success: true, message: "Vendor company deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Vendor Contact (similar pattern) ----------
// ... createVendorContact, getVendorContacts, etc.

// ---------- Vendor Resource (similar pattern) ----------
// ... createVendorResource, getVendorResources, etc.