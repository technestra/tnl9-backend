//  import mongoose from "mongoose";

// const contactPersonSchema = new mongoose.Schema(
//   {
//     /* LINKED COMPANY */
//     company: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Company",
//       required: true
//     },

//     /* CONTACT INFO */
//     name: {
//       type: String,
//       required: true,
//       trim: true
//     },

//     email: {
//       type: String,
//       lowercase: true
//     },

//     phone: {
//       type: String,
//       required: true
//     },

//     designation: String,

//     linkedin: String,

//     /* SNAPSHOT (FOR FAST UI DISPLAY) */
//     companySnapshot: {
//       companyName: String,
//       ownerName: String,
//       companyEmail: String,
//       companyLinkedin: String,
//       coordinatorContactNumber: String
//     },

//     /* META */
//     isActive: {
//       type: Boolean,
//       default: true
//     },

//     createdBy: {
//       userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User"
//       },
//       role: {
//         type: String,
//         enum: ["SUPER_ADMIN", "ADMIN", "USER"]
//       }
//     }
//   },
//   { timestamps: true }
// );

// export default mongoose.model("ContactPerson", contactPersonSchema);


// models/ContactPerson.js
import mongoose from "mongoose";

const contactPersonSchema = new mongoose.Schema(
  {
    /* COMPANY LINK */
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    /* COMPANY SNAPSHOT (AUTO-FILL) */
    companySnapshot: {
      companyName: String,
      ownerName: String,
      companyLinkedin: String,
      companyContact: String
    },

    /* CONTACT INFO */
    name: {
      type: String,
      required: true
    },
    email: String,
    phone: {
      type: String,
      required: true
    },
    designation: String,
    linkedin: String,

    /* STATUS */
    isActive: {
      type: Boolean,
      default: true
    },

    /* CREATED BY */
    createdBy: {
      userId: {
        type: String, // because JWT gives string id
        required: true
      },
      role: {
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "USER"],
        required: true
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("ContactPerson", contactPersonSchema);
