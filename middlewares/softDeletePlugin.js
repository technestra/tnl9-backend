import mongoose from "mongoose";

const softDeletePlugin = (schema, options = {}) => {
  schema.add({
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  });

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

  schema.pre(/^find/, function () {
    if (this.options && this.options.withDeleted) {
      return;
    }

    this.where({ isDeleted: { $ne: true } });
  });
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