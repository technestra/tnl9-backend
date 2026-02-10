
// import mongoose from "mongoose";

// const historySchema = new mongoose.Schema({
//   action: {
//     type: String,
//     required: true,
//     enum: ['assigned', 'returned', 'created', 'updated','trashed','restored']
//   },
//   to: String,
//   date: Date,
//   condition: String,
//   remarks: String
// }, { _id: false });

// const assetSchema = new mongoose.Schema({
//   company: {
//     type: String,
//     required: [true, 'Company is required'],
//     trim: true
//   },
//   category: {
//     type: String,
//     required: [true, 'Category is required'],
//     trim: true
//   },
//   brand: {
//     type: String,
//     required: [true, 'Brand is required'],
//     trim: true
//   },
//   model: {
//     type: String,
//     trim: true
//   },
//   serial: {
//     type: String,
//     required: [true, 'Serial number is required'],
//     unique: true,
//     trim: true
//   },
//   asset_tag: {
//     type: String,
//     trim: true
//   },
//   purchase_date: {
//     type: Date,
//     required: [true, 'Purchase date is required']
//   },
//   purchase_cost: {
//     type: Number,
//     required: [true, 'Purchase cost is required'],
//     min: 0
//   },

//   gst: {
//     type: Number,
//     min: 0,
//     default: null
//   },

//   total_cost: {
//     type: Number,
//     min: 0,
//     default: null
//   },
//   vendor: {
//     type: String,
//     trim: true
//   },
//   warranty: {
//     type: Date
//   },
//   photo: {
//     type: String // Cloudinary URL or base64 encoded image
//   },
//   cloudinary_id: {
//     type: String // Cloudinary public_id for deletion
//   },
//   assigned_to: {
//     type: String,
//     trim: true,
//     default: null
//   },
//   assigned_date: {
//     type: Date,
//     default: null
//   },
//   return_date: {
//     type: Date
//   },
//   return_condition: {
//     type: String
//   },
//   return_remarks: {
//     type: String
//   },
//   specifications: {
//     type: Map,
//     of: String,
//     default: {}
//   },

//   // ── Added for Trash / Soft Delete feature ──
//   isTrashed: {
//     type: Boolean,
//     default: false
//   },

//   history: [historySchema],
//   status: {
//     type: String,
//     enum: ['available', 'assigned'],
//     default: 'available'
//   },
//   created_by: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   },
//   updated_by: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }
// }, {
//   timestamps: true
// });

// // Update status based on assigned_to
// // assetSchema.pre('save', function(next) {
// //   this.status = this.assigned_to ? 'assigned' : 'available';
// //   next();
// // });

// assigned_to: {
//   type: String,
//   trim: true,
//   default: null,
//   set: function (value) {
//     this.status = value ? 'assigned' : 'available';
//     return value;
//   }
// };


// // Indexes for better query performance
// assetSchema.index({ company: 1, category: 1 });
// assetSchema.index({ serial: 1 });
// assetSchema.index({ asset_tag: 1 });
// assetSchema.index({ status: 1 });

// // Optional: index on isTrashed if you query it often
// assetSchema.index({ isTrashed: 1 });

// const Asset = mongoose.model('Asset', assetSchema);

// export default Asset;

import mongoose from "mongoose";

/* ───────────────── History Schema ───────────────── */
const historySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['assigned', 'returned', 'created', 'updated', 'trashed', 'restored']
    },
    to: String,
    date: {
      type: Date,
      default: Date.now
    },
    condition: String,
    remarks: String
  },
  { _id: false }
);

/* ───────────────── Asset Schema ───────────────── */
const assetSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true
    },
    model: {
      type: String,
      trim: true
    },
    serial: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true
    },
    asset_tag: {
      type: String,
      trim: true
    },
    purchase_date: {
      type: Date,
      required: [true, 'Purchase date is required']
    },
    purchase_cost: {
      type: Number,
      required: [true, 'Purchase cost is required'],
      min: 0
    },
    gst: {
      type: Number,
      min: 0,
      default: null
    },
    total_cost: {
      type: Number,
      min: 0,
      default: null
    },
    vendor: {
      type: String,
      trim: true
    },
    warranty: {
      type: Date
    },
    photo: {
      type: String
    },
    cloudinary_id: {
      type: String
    },

    /* ───── Assignment Fields (Setter Based) ───── */
    assigned_to: {
      type: String,
      trim: true,
      default: null,
      set: function (value) {
        this.status = value ? 'assigned' : 'available';
        return value;
      }
    },
    assigned_date: {
      type: Date,
      default: null
    },
    return_date: Date,
    return_condition: String,
    return_remarks: String,

    specifications: {
      type: Map,
      of: String,
      default: {}
    },

    /* ───── Soft Delete ───── */
    isTrashed: {
      type: Boolean,
      default: false
    },

    history: [historySchema],

    status: {
      type: String,
      enum: ['available', 'assigned'],
      default: 'available'
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

/* ───────────────── Indexes ───────────────── */
assetSchema.index({ company: 1, category: 1 });
assetSchema.index({ serial: 1 });
assetSchema.index({ asset_tag: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ isTrashed: 1 });

/* ───────────────── Model ───────────────── */
const Asset = mongoose.model('Asset', assetSchema);
export default Asset;
