import VendorCompany from "./vendorCompany.js";
import VendorContact from "./vendorContact.js";
import VendorResource from "./vendorResource.js";

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



// export const createVendorCompany = async (req, res) => {
//   try {
//     const data = { ...req.body, createdBy: req.user._id };
//     const company = new VendorCompany(data);
//     await company.save();
//     res.status(201).json({ success: true, data: company });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// /**
//  * Get all VendorCompanies with search & pagination
//  * GET /api/vendor/companies
//  * Permission: vendor:read
//  */
// export const getVendorCompanies = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search, ...filters } = req.query;
//     const query = { ...filters };

//     // Search across multiple fields
//     if (search) {
//       query.$or = [
//         { ownerName: { $regex: search, $options: "i" } },
//         { vendorId: { $regex: search, $options: "i" } },
//         { website: { $regex: search, $options: "i" } },
//         { "emails.email": { $regex: search, $options: "i" } },
//         { "contacts.number": { $regex: search, $options: "i" } },
//       ];
//     }

//     // Pagination support (with or without mongoose-paginate)
//     let companies;
//     if (typeof VendorCompany.paginate === "function") {
//       const options = {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         sort: { createdAt: -1 },
//         populate: ["createdBy", "updatedBy"],
//       };
//       companies = await VendorCompany.paginate(query, options);
//     } else {
//       const skip = (parseInt(page) - 1) * parseInt(limit);
//       const data = await VendorCompany.find(query)
//         .populate("createdBy updatedBy")
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit));
//       const total = await VendorCompany.countDocuments(query);
//       companies = {
//         docs: data,
//         totalDocs: total,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         totalPages: Math.ceil(total / parseInt(limit)),
//       };
//     }

//     res.json({ success: true, data: companies });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// /**
//  * Get single VendorCompany by ID
//  * GET /api/vendor/companies/:id
//  * Permission: vendor:read
//  */
// export const getVendorCompanyById = async (req, res) => {
//   try {
//     const company = await VendorCompany.findById(req.params.id)
//       .populate("createdBy updatedBy");
//     if (!company) {
//       return res.status(404).json({ success: false, message: "Vendor company not found" });
//     }
//     res.json({ success: true, data: company });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// /**
//  * Update VendorCompany
//  * PUT /api/vendor/companies/:id
//  * Permission: vendor:update + ownership (checked in route)
//  */
// export const updateVendorCompany = async (req, res) => {
//   try {
//     const company = await VendorCompany.findById(req.params.id);
//     if (!company) {
//       return res.status(404).json({ success: false, message: "Vendor company not found" });
//     }

//     // Prevent overwriting immutable fields if they exist
//     const { vendorId, ...updatableFields } = req.body;
//     Object.assign(company, updatableFields);
//     company.updatedBy = req.user._id;

//     await company.save();
//     res.json({ success: true, data: company });
//   } catch (error) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// /**
//  * Soft delete VendorCompany
//  * DELETE /api/vendor/companies/:id
//  * Permission: vendor:delete + ownership
//  */
// export const deleteVendorCompany = async (req, res) => {
//   try {
//     const company = await VendorCompany.findById(req.params.id);
//     if (!company) {
//       return res.status(404).json({ success: false, message: "Vendor company not found" });
//     }
//     await company.softDelete(req.user._id);
//     res.json({ success: true, message: "Vendor company deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// ----------------------------------------------------------------------
// ------------------------- VENDOR CONTACT -----------------------------
// ----------------------------------------------------------------------

/**
 * Create a new VendorContact
 * POST /api/vendor/contacts
 * Permission: vendor:create
 */
export const createVendorContact = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const contact = new VendorContact(data);
    await contact.save();
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get all VendorContacts with search & pagination
 * GET /api/vendor/contacts
 * Permission: vendor:read
 */
export const getVendorContacts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, companyId, ...filters } = req.query;
    const query = { ...filters };

    if (companyId) {
      query.company = companyId;
    }

    // Search across name, email, phone, etc.
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "emails.email": { $regex: search, $options: "i" } },
        { "contactNumbers.number": { $regex: search, $options: "i" } },
        { skillSet: { $regex: search, $options: "i" } },
      ];
    }

    let contacts;
    const populateOptions = [
      { path: "company", select: "ownerName vendorId" },
      { path: "createdBy", select: "name email" },
      { path: "updatedBy", select: "name email" },
    ];

    if (typeof VendorContact.paginate === "function") {
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: populateOptions,
      };
      contacts = await VendorContact.paginate(query, options);
    } else {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const data = await VendorContact.find(query)
        .populate(populateOptions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      const total = await VendorContact.countDocuments(query);
      contacts = {
        docs: data,
        totalDocs: total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      };
    }

    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single VendorContact by ID
 * GET /api/vendor/contacts/:id
 * Permission: vendor:read
 */
export const getVendorContactById = async (req, res) => {
  try {
    const contact = await VendorContact.findById(req.params.id)
      .populate("company", "ownerName vendorId")
      .populate("createdBy updatedBy");
    if (!contact) {
      return res.status(404).json({ success: false, message: "Vendor contact not found" });
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update VendorContact
 * PUT /api/vendor/contacts/:id
 * Permission: vendor:update + ownership
 */
export const updateVendorContact = async (req, res) => {
  try {
    const contact = await VendorContact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Vendor contact not found" });
    }

    // No immutable fields to skip
    Object.assign(contact, req.body);
    contact.updatedBy = req.user._id;

    await contact.save();
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Soft delete VendorContact
 * DELETE /api/vendor/contacts/:id
 * Permission: vendor:delete + ownership
 */
export const deleteVendorContact = async (req, res) => {
  try {
    const contact = await VendorContact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: "Vendor contact not found" });
    }
    await contact.softDelete(req.user._id);
    res.json({ success: true, message: "Vendor contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------------------------
// ------------------------- VENDOR RESOURCE ----------------------------
// ----------------------------------------------------------------------

/**
 * Create a new VendorResource
 * POST /api/vendor/resources
 * Permission: vendor:create
 */
export const createVendorResource = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const resource = new VendorResource(data);
    await resource.save();
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get all VendorResources with search & pagination
 * GET /api/vendor/resources
 * Permission: vendor:read
 */
export const getVendorResources = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, vendorCompanyId, ...filters } = req.query;
    const query = { ...filters };

    if (vendorCompanyId) {
      query.vendorCompany = vendorCompanyId;
    }

    if (search) {
      query.$or = [
        { process: { $regex: search, $options: "i" } },
        { comment: { $regex: search, $options: "i" } },
        { additionalInfo: { $regex: search, $options: "i" } }, // if string
      ];
    }

    const populateOptions = [
      { path: "vendorCompany", select: "ownerName vendorId" },
      { path: "contacts", select: "name emails contactNumbers" },
      { path: "createdBy", select: "name email" },
    ];

    let resources;
    if (typeof VendorResource.paginate === "function") {
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: populateOptions,
      };
      resources = await VendorResource.paginate(query, options);
    } else {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const data = await VendorResource.find(query)
        .populate(populateOptions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      const total = await VendorResource.countDocuments(query);
      resources = {
        docs: data,
        totalDocs: total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      };
    }

    res.json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single VendorResource by ID
 * GET /api/vendor/resources/:id
 * Permission: vendor:read
 */
export const getVendorResourceById = async (req, res) => {
  try {
    const resource = await VendorResource.findById(req.params.id)
      .populate("vendorCompany", "ownerName vendorId")
      .populate("contacts", "name emails")
      .populate("createdBy");
    if (!resource) {
      return res.status(404).json({ success: false, message: "Vendor resource not found" });
    }
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update VendorResource
 * PUT /api/vendor/resources/:id
 * Permission: vendor:update + ownership
 */
export const updateVendorResource = async (req, res) => {
  try {
    const resource = await VendorResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Vendor resource not found" });
    }

    Object.assign(resource, req.body);
    // No updatedBy field in schema? add if needed
    // resource.updatedBy = req.user._id; // schema lacks updatedBy – we can add it

    await resource.save();
    res.json({ success: true, data: resource });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Soft delete VendorResource
 * DELETE /api/vendor/resources/:id
 * Permission: vendor:delete + ownership
 */
export const deleteVendorResource = async (req, res) => {
  try {
    const resource = await VendorResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Vendor resource not found" });
    }
    await resource.softDelete(req.user._id);
    res.json({ success: true, message: "Vendor resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};