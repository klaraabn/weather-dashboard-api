import mongoose from "mongoose";

// One saved city of the Weather Dashboard
const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "City name is required"],
      trim: true,
      maxlength: [50, "City name must be under 50 characters"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },
    unit: {
      type: String,
      enum: { values: ["C", "F"], message: "Unit must be C or F" },
      default: "C",
    },
    note: {
      type: String,
      trim: true,
      maxlength: [100, "Note must be under 100 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// Model City -> collection "cities"
export const City = mongoose.model("City", citySchema);
