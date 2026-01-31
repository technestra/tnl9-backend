import {v2 as cloudinary } from "cloudinary";

console.log("=== Cloudinary Loading ===");
console.log("CLOUDINARY_NAME:", process.env.CLOUDINARY_NAME || "MISSING");
console.log("CLOUDINARY_KEY:", process.env.CLOUDINARY_KEY ? "PRESENT" : "MISSING");
console.log("CLOUDINARY_SECRET:", process.env.CLOUDINARY_SECRET ? "PRESENT" : "MISSING");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

console.log("Cloudinary config applied:", cloudinary.config().cloud_name ? "Success" : "Failed");

export default cloudinary;
