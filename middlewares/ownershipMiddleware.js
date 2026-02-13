export const checkOwnership = (modelName) => {
  return async (req, res, next) => {
    try {
      let Model;
      let paramId = req.params.id || req.params.userId;

      switch (modelName) {
        case 'Company':
          Model = (await import('../models/Company.js')).default;
          break;
        case 'ContactPerson':
          Model = (await import('../models/ContactPerson.js')).default;
          break;
        case 'Suspect':
          Model = (await import('../models/Suspect.js')).default;
          break;
        case 'Prospect':
          Model = (await import('../models/Prospect.js')).default;
          break;
        case 'Lead':
          Model = (await import('../models/Lead.js')).default;
          break;


        // vendore
        case 'VendorCompany':
          Model = (await import('../src/vendore/VendorCompany.js')).default;
          break;
        case 'VendorContact':
          Model = (await import('../src/vendore/models/VendorContact.js')).default;
          break;
        case 'VendorResource':
          Model = (await import('../src/vendore/VendorResource.js')).default;
          break;


          
        default:
          return res.status(400).json({ message: "Invalid model" });
      }

      const document = await Model.findById(paramId);

      if (!document) {
        return res.status(404).json({ message: `${modelName} not found` });
      }

      if (req.user.role === "SUPER_ADMIN") {
        req.document = document;
        return next();
      }

      if (document.createdBy?.userId?.toString() === req.user.id.toString()) {
        req.document = document;
        return next();
      }

      if (modelName === 'Company') {
        const isAssignedAdmin = document.assignedAdmins?.some(
          adminId => adminId.toString() === req.user.id.toString()
        );

        const isAssignedUser = document.assignedUsers?.some(
          userId => userId.toString() === req.user.id.toString()
        );

        if (isAssignedAdmin || isAssignedUser) {
          req.document = document;
          return next();
        }
      }

      return res.status(403).json({
        message: "You don't have permission to access this resource"
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};