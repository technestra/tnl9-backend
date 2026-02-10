import mongoose from "mongoose";
import softDeletePlugin from "../middlewares/softDeletePlugin.js";
import { v4 as uuidv4 } from 'uuid';

const companySchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      unique: true,
      sparse: true,
    },
    /* BASIC INFO */
    companyName: {
      type: String,
      required: true,
      trim: true
    },

    ownerName: {
      type: String,
      required: true
    },

    companyEmail: {
      type: String,
      required: true,
      lowercase: true,
      unique: true
    },

    companyWebsite: {
      type: String
    },

    companyLinkedin: {
      type: String
    },

    companyCapability: {
      type: [String],
      required: true
    },
    companySize: {
      type: String,
      required: true
    },

    companySource: {
      type: String,
      enum: ["LinkedIn", "UpWork", "Event", "Referral", "Cold Email", "Tender", "Other"],
      required: true
    },

    companyAddress: {
      type: String,
      required: true
    },

    hasBench: {
      type: Boolean,
      required: true
    },

    resourceFromMarket: {
      type: Boolean,
      // required: true
    },
    companyCountry: {
      type: String
    },

    comment: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      userName: {
        type: String,
      },
      role: {
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "USER"],
      },
    },

    assignedAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

companySchema.pre("save", async function () {
  if (!this.companyId) {
    this.companyId = uuidv4(); 
  }
});

companySchema.plugin(softDeletePlugin);
export default mongoose.model("Company", companySchema);


// import mongoose from "mongoose";
// import { v4 as uuidv4 } from 'uuid';
// // softDeletePlugin को हटा दें और अपना custom logic implement करें

// const companySchema = new mongoose.Schema(
//   {
//     companyId: {
//       type: String,
//       unique: true,
//       sparse: true,
//     },
//     /* BASIC INFO */
//     companyName: {
//       type: String,
//       required: true,
//       trim: true
//     },
//     ownerName: {
//       type: String,
//       required: true
//     },
//     companyEmail: {
//       type: String,
//       required: true,
//       lowercase: true,
//       unique: true
//     },
//     companyWebsite: {
//       type: String
//     },
//     companyLinkedin: {
//       type: String
//     },
//     companyCapability: {
//       type: [String],
//       required: true
//     },
//     companySize: {
//       type: String,
//       required: true
//     },
//     companySource: {
//       type: String,
//       enum: ["LinkedIn", "UpWork", "Event", "Referral", "Cold Email", "Tender", "Other"],
//       required: true
//     },
//     companyAddress: {
//       type: String,
//       required: true
//     },
//     hasBench: {
//       type: Boolean,
//       required: true
//     },
//     resourceFromMarket: {
//       type: Boolean,
//     },
//     companyCountry: {
//       type: String
//     },
//     comment: {
//       type: String
//     },
//     isActive: {
//       type: Boolean,
//       default: true
//     },
//     deleted: {  // ✅ नया field add करें
//       type: Boolean,
//       default: false,
//       index: true  // Index add करें fast query के लिए
//     },
//     deletedBy: {
//       userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//       userName: String,
//       role: String,
//       deletedAt: Date
//     },
//     createdBy: {
//       userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//       userName: {
//         type: String,
//       },
//       role: {
//         type: String,
//         enum: ["SUPER_ADMIN", "ADMIN", "USER"],
//       },
//     },
//     assignedAdmins: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User"
//       }
//     ],
//     assignedUsers: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User"
//       }
//     ]
//   },
//   { timestamps: true }
// );

// // UUID generate करने के लिए middleware
// companySchema.pre("save", async function () {
//   if (!this.companyId) {
//     this.companyId = uuidv4(); 
//   }
// });

// // ✅ नया instance method soft delete के लिए
// companySchema.methods.softDelete = async function(user) {
//   this.deleted = true;
//   this.deletedBy = {
//     userId: user.id,
//     userName: user.name || user.email,
//     role: user.role,
//     deletedAt: new Date()
//   };
//   return this.save();
// };

// // ✅ नया instance method restore के लिए
// companySchema.methods.restore = async function() {
//   this.deleted = false;
//   this.deletedBy = undefined;
//   return this.save();
// };

// // ✅ Query helper for deleted documents
// companySchema.query.notDeleted = function() {
//   return this.where({ deleted: false });
// };

// companySchema.query.onlyDeleted = function() {
//   return this.where({ deleted: true });
// };

// // ✅ Static method for counting
// companySchema.statics.getDeletedCount = function() {
//   return this.countDocuments({ deleted: true });
// };

// export default mongoose.model("Company", companySchema);