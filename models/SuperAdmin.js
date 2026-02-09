import mongoose from "mongoose";
import softDeletePlugin from "../middlewares/softDeletePlugin.js";

const superAdminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "SUPER_ADMIN"
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

superAdminSchema.plugin(softDeletePlugin);
export default mongoose.model("SuperAdmin", superAdminSchema);