// import mongoose from "mongoose";

// const suspectSchema = new mongoose.Schema(
//   {
//     suspectId: {
//       type: String, 
//       required: true,
//       unique: true
//     },
//     company: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Company",
//       required: true
//     },

//     /* BASIC INFO */
//     userName: {
//       type: String,
//       required: true,
//       trim: true
//     },

//     email: {
//       type: String,
//       lowercase: true
//     },

//     linkedin: {
//       type: String
//     },

//     userCompany: {
//       type: String
//     },

//     /* LOCATIONS */
//     companyLocation: {
//       type: String
//     },

//     currentLocation: {
//       type: String
//     },

//     previousCompany: {
//       type: String
//     },

//     currentCompany: {
//       type: String
//     },

//     budget: {
//       type: String 
//     },
//     firstContactedOn: {
//       type: Date
//     },
//     lastContactedOn: {
//       type: Date
//     },
//     lastFollowedUpOn: {
//       type: Date
//     },
//     nextFollowUpOn: {
//       type: Date
//     },
//     interestLevel: {
//       type: String,
//       enum: ["High", "Medium", "Low"]
//     },

//     companySnapshot: {
//       companyName: {
//         type: String,
//         required: true
//       },
//       companyEmail: {
//         type: String
//       },
//       companyWebsite: {
//         type: String
//       },
//       companyLinkedin: {
//         type: String
//       }
//     },


//     /* MULTIPLE CONTACTS */
//     contacts: [
//       {
//         type: {
//           type: String,
//           enum: ["phone", "whatsapp", "email"],
//           required: true
//         },
//         value: {
//           type: String,
//           required: true
//         }
//       }
//     ],

//     remarks: {
//       type: String
//     },
//     suspectSource: {
//       type: String,
//       enum: ["LinkedIn", "UpWork", "Event", "Referral", "Cold Email", "Tender", "Other"],
//       required: true
//     },

//     status: {
//       type: String,
//       enum: ["SUSPECT", "New", "Contacted", "Converted", "Junk"],
//       default: "SUSPECT"
//     },

//     /* CREATED BY */
//     createdBy: {
//       userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//       },
//       role: {
//         type: String,
//         enum: ["SUPER_ADMIN", "ADMIN", "USER"],
//         required: true
//       }
//     },
//     createdAt: {
//       type: Date,
//       default: Date.now
//     },
//     isActive: {
//       type: Boolean,
//       default: true
//     }
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Suspect", suspectSchema);



import mongoose from "mongoose";

const suspectSchema = new mongoose.Schema(
  {
    suspectId: {
      type: String, 
      required: true,
      unique: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    /* BASIC INFO */
    contactSnapshot: {
      contactName: {
        type: String
      },
      contactEmail: {
        type: String 
      },
      contactPhone:{
        type: String 
      },
      contactDesignation:{
        type: String 
      },
      contactLinkedin: {
        type: String 
      }
    },
    


    /* LOCATIONS */

    currentLocation: {
      type: String
    },

    previousCompany: {
      type: String
    },

    currentCompany: {
      type: String
    },

    budget: {
      type: String 
    },
    firstContactedOn: {
      type: Date
    },
    lastContactedOn: {
      type: Date
    },
    lastFollowedUpOn: {
      type: Date
    },
    nextFollowUpOn: {
      type: Date
    },
    interestLevel: {
      type: String,
      enum: ["High", "Medium", "Low"]
    },

    companySnapshot: {
      companyName: {
        type: String,
        required: true
      },
      companyEmail: {
        type: String
      },
      companyWebsite: {
        type: String
      },
      companyLinkedin: {
        type: String
      },
      companyAddress: {
        type: String
      }
    },


    /* MULTIPLE CONTACTS */
    contacts: [
      {
        type: {
          type: String,
          enum: ["phone", "whatsapp", "email"],
          required: true
        },
        value: {
          type: String,
          required: true
        }
      }
    ],

    remarks: {
      type: String
    },
    suspectSource: {
      type: String,
      enum: ["LinkedIn", "UpWork", "Event", "Referral", "Cold Email", "Tender", "Other"],
      required: true
    },

    status: {
      type: String,
      enum: ["SUSPECT", "New", "Contacted", "Converted", "Junk"],
      default: "SUSPECT"
    },

    /* CREATED BY */
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      role: {
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "USER"],
        required: true
      }
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Suspect", suspectSchema);
