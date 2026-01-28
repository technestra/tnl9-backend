import mongoose from "mongoose";


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


export default mongoose.model("SuperAdmin", superAdminSchema);