import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import companyRoutes from "./routes/companyRoutes.js"; 
import companyAssignmentRoutes from "./routes/companyAssignmentRoutes.js";
import userRoutes from './routes/userRoutes.js';
import employeeProfileRoutes from './routes/employeeProfileRoutes.js';
import suspectRoutes from './routes/suspectRoutes.js';
import prospectRoutes from "./routes/prospectRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import employeeDocumentRoutes from "./routes/employeeDocumentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import contactPersonRoutes from "./routes/contactPersonRoutes.js";
import importRoutes from "./routes/importRoutes.js";
import moduleRoleRoutes from "./routes/moduleRoleRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";

dotenv.config();
connectDB();


const app = express();
// app.use(cors());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://tnl9.com"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ],
    credentials: true
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/company-access", companyAssignmentRoutes);
app.use('/api/employee', employeeProfileRoutes);
app.use('/api/users', userRoutes);
app.use("/api/suspect", suspectRoutes);
app.use("/api/prospects", prospectRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employee-documents", employeeDocumentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/contacts", contactPersonRoutes);
app.use("/api/import", importRoutes);
app.use("/api/module-roles", moduleRoleRoutes);

app.use(notFound);
app.use(errorHandler);

app.get("/", (req, res) => {
res.send("API Running");
});


app.listen(process.env.PORT, () => {
console.log(`Server running on port ${process.env.PORT}`);
});
