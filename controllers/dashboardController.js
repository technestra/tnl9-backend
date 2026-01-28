import Suspect from "../models/Suspect.js";
import Prospect from "../models/Prospect.js";
import Lead from "../models/Lead.js";

export const getDashboardStats = async (req, res) => {
  try {
    const filter =
      req.user.role === "SUPER_ADMIN"
        ? {}
        : { createdBy: req.user.id };

    const suspects = await Suspect.countDocuments(filter);
    const prospects = await Prospect.countDocuments(filter);
    const leads = await Lead.countDocuments(filter);
    const wonDeals = await Lead.countDocuments({
      ...filter,
      stage: "WON"
    });

    res.json({
      suspects,
      prospects,
      leads,
      wonDeals
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const getFunnelStats = async (req, res) => {
  try {
    const baseFilter =
      req.user.role === "SUPER_ADMIN"
        ? {}
        : { createdBy: req.user.id };

    const suspects = await Suspect.countDocuments(baseFilter);
    const prospects = await Prospect.countDocuments(baseFilter);
    const leads = await Lead.countDocuments(baseFilter);
    const won = await Lead.countDocuments({
      ...baseFilter,
      stage: "WON"
    });

    res.json([
      { name: "Suspects", value: suspects },
      { name: "Prospects", value: prospects },
      { name: "Leads", value: leads },
      { name: "Won", value: won }
    ]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


