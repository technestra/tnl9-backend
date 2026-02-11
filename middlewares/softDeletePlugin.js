import mongoose from "mongoose";

const softDeletePlugin = (schema) => {
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  });

  schema.methods.softDelete = async function (userId = null) {
    if (this.isDeleted) return this;

    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;

    return this.save();
  };

  schema.methods.restore = async function () {
    if (!this.isDeleted) return this;

    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;

    return this.save();
  };

  schema.statics.findDeleted = function (conditions = {}) {
    return this.find({ ...conditions, isDeleted: true }).setOptions({
      withDeleted: true
    });
  };

  schema.statics.findOneDeleted = function (conditions = {}) {
    return this.findOne({ ...conditions, isDeleted: true }).setOptions({
      withDeleted: true
    });
  };

  schema.statics.findWithDeleted = function (conditions = {}) {
    return this.find(conditions).setOptions({
      withDeleted: true
    });
  };

  schema.statics.findOneWithDeleted = function (conditions = {}) {
    return this.findOne(conditions).setOptions({
      withDeleted: true
    });
  };

  schema.pre(/^find/, function () {
    if (this.getOptions()?.withDeleted) return;
    this.where({ isDeleted: { $ne: true } });
  });

  schema.pre("countDocuments", function () {
    if (this.getOptions()?.withDeleted) return;
    this.where({ isDeleted: { $ne: true } });
  });

  schema.pre("findOneAndUpdate", function () {
    if (this.getOptions()?.withDeleted) return;
    this.where({ isDeleted: { $ne: true } });
  });

  schema.pre("findOneAndDelete", function () {
    if (this.getOptions()?.withDeleted) return;
    this.where({ isDeleted: { $ne: true } });
  });
};

export default softDeletePlugin;
