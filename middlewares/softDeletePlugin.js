// import mongoose from "mongoose";

// const softDeletePlugin = (schema, options = {}) => {
//   // Add soft delete fields
//   schema.add({
//     isDeleted: { type: Boolean, default: false },
//     deletedAt: { type: Date },
//     deletedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User"
//     }
//   });

//   // Pre-find middleware to exclude deleted documents
//   schema.pre(/^find/, function() {
//     if (this.options && this.options.withDeleted) {
//       return;
//     }
//     this.where({ isDeleted: false });
//   });

//   // Pre-count middleware
//   schema.pre("countDocuments", function() {
//     if (this.options && this.options.withDeleted) {
//       return;
//     }
//     this.where({ isDeleted: false });
//   });

//   // Pre-findOne middleware
//   schema.pre("findOne", function() {
//     if (this.options && this.options.withDeleted) {
//       return;
//     }
//     this.where({ isDeleted: false });
//   });

//   // Basic static methods
//   schema.statics.findDeleted = function() {
//     return this.find({ isDeleted: true });
//   };

//   schema.statics.softDeleteById = async function(id, deletedBy) {
//     return this.findByIdAndUpdate(
//       id,
//       {
//         isDeleted: true,
//         deletedAt: new Date(),
//         deletedBy: deletedBy
//       },
//       { new: true }
//     );
//   };

//   // Instance method
//   schema.methods.softDelete = async function(deletedBy) {
//     this.isDeleted = true;
//     this.deletedAt = new Date();
//     this.deletedBy = deletedBy;
//     return this.save();
//   };

//   schema.methods.restore = async function() {
//     this.isDeleted = false;
//     this.deletedAt = null;
//     this.deletedBy = null;
//     return this.save();
//   };
// };
import mongoose from "mongoose";

const softDeletePlugin = (schema, options = {}) => {
  // Add soft delete fields
  schema.add({
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  });

  // Instance methods for soft delete & restore
  schema.methods.softDelete = async function (deletedBy) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    return this.save();
  };

  schema.methods.restore = async function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
  };

  // Custom static methods
  schema.statics.findDeleted = function (conditions = {}) {
    return this.find({ ...conditions, isDeleted: true });
  };

  schema.statics.findWithDeleted = function (conditions = {}) {
    return this.find(conditions);
  };

  schema.statics.findOneDeleted = function (conditions = {}) {
    return this.findOne({ ...conditions, isDeleted: true });
  };

  schema.statics.findOneWithDeleted = function (conditions = {}) {
    return this.findOne(conditions);
  };

  // Default filter for all queries (no pre-hook, no next)
  // Deleted documents को hide करने के लिए हर query में filter लगेगा
  schema.pre(/^find/, function () {
    if (this.options && this.options.withDeleted) {
      // Bypass filter if withDeleted: true
      return;
    }

    // Exclude deleted by default
    this.where({ isDeleted: { $ne: true } });
  });

  // Other query types के लिए भी filter apply
  schema.pre(/^findOne/, function () {
    if (this.options && this.options.withDeleted) return;
    this.where({ isDeleted: { $ne: true } });
  });

  schema.pre('countDocuments', function () {
    if (this.options && this.options.withDeleted) return;
    this.where({ isDeleted: { $ne: true } });
  });

  schema.pre('findOneAndUpdate', function () {
    if (this.options && this.options.withDeleted) return;
    this.where({ isDeleted: { $ne: true } });
  });

  schema.pre('findOneAndDelete', function () {
    if (this.options && this.options.withDeleted) return;
    this.where({ isDeleted: { $ne: true } });
  });
};

export default softDeletePlugin;