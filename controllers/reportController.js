import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Prospect from "../models/Prospect.js";
import Lead from "../models/Lead.js";

export const monthlyReport = async (req, res) => {
  try {
    const { month } = req.query;
    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const isSuperAdmin = req.user.role === "SUPER_ADMIN";

    const filter = {
      createdAt: { $gte: start, $lt: end }
    };

    if (!isSuperAdmin) {
      filter.createdBy = req.user._id;
    }

    const prospects = await Prospect.find(filter)
      .populate("company")
      .populate("createdBy");

    const leads = await Lead.find(filter)
      .populate("company")
      .populate("createdBy");

    const summary = {
      totalProspects: prospects.length,
      wonProspects: prospects.filter(p => p.status === "WON").length,
      totalLeads: leads.length
    };

    const companyWise = {};
    leads.forEach(l => {
      const company = l.company.companyName;
      companyWise[company] = (companyWise[company] || 0) + 1;
    });

    const userWise = {};
    leads.forEach(l => {
      const user = l.createdBy.username;
      userWise[user] = (userWise[user] || 0) + 1;
    });

    res.json({
      month,
      summary,
      companyWise,
      userWise
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMonthlyReport = async (req, res) => {
  try {
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }

    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const prospects = await Prospect.find({
      createdAt: { $gte: startDate, $lt: endDate }
    });

    const totalProspects = prospects.length;
    const wonProspects = prospects.filter(p => p.status === "WON").length;

    const leads = await Lead.find({
      createdAt: { $gte: startDate, $lt: endDate }
    })
      .populate("company", "companyName")
      .populate("createdBy.userId", "name");

    const companyStats = {};

    leads.forEach(l => {
      const companyName = l.company?.companyName || "Unknown";
      companyStats[companyName] = (companyStats[companyName] || 0) + 1;
    });

    const userStats = {};

    leads.forEach(l => {
      const userName = l.createdBy?.userId?.name || "Unknown";
      userStats[userName] = (userStats[userName] || 0) + 1;
    });

    res.json({
      month,
      summary: {
        totalProspects,
        wonProspects,
        totalLeads: leads.length
      },
      companyWise: companyStats,
      userWise: userStats,
      leads
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const exportMonthlyReport = async (req, res) => {
  const { month, type } = req.query;
  const user = req.user;

  const start = new Date(`${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  let filter = { wonDate: { $gte: start, $lt: end } };

  if (user.role === "USER") filter.createdBy = user._id;
  if (user.role === "ADMIN") filter.company = user.company;

  const leads = await Lead.find(filter)
    .populate("company", "companyName")
    .populate("suspect", "username");

  if (type === "excel") {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Monthly Report");

    ws.columns = [
      { header: "Company", key: "company" },
      { header: "User", key: "user" },
      { header: "Requirement", key: "req" },
      { header: "Budget", key: "budget" },
      { header: "Won Date", key: "date" }
    ];

    leads.forEach(l =>
      ws.addRow({
        company: l.company.companyName,
        user: l.suspect.username,
        req: l.requirement,
        budget: l.budget,
        date: l.wonDate.toDateString()
      })
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=monthly-report.xlsx"
    );
    await wb.xlsx.write(res);
    return res.end();
  }

  const doc = new PDFDocument();
  res.setHeader("Content-Disposition", "attachment; filename=monthly-report.pdf");
  doc.pipe(res);

  doc.fontSize(18).text("Monthly Report", { align: "center" });
  doc.moveDown();

  leads.forEach(l => {
    doc
      .fontSize(10)
      .text(
        `${l.company.companyName} | ${l.suspect.username} | ₹${l.budget}`
      );
  });

  doc.end();
};
