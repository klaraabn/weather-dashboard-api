import express from "express";
import mongoose from "mongoose";
import { City } from "../models/City.js";

const router = express.Router();

// 400 for anything that is not a valid ObjectId
function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  next();
}

// Mongoose errors -> one readable message
function badDataMessage(err) {
  if (err.name === "ValidationError") {
    return Object.values(err.errors)
      .map((e) => (e.name === "CastError" ? `Invalid value for ${e.path}` : e.message))
      .join(", ");
  }
  return `Invalid value for ${err.path}`; // CastError, e.g. latitude: "abc"
}

function isBadData(err) {
  return err.name === "ValidationError" || err.name === "CastError";
}

// GET /api/cities  (optional ?search=)
router.get("/", async (req, res) => {
  try {
    const re = { $regex: req.query.search ?? "", $options: "i" };
    const cities = await City.find({ name: re }).sort({ createdAt: -1 });
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: "Could not load the cities" });
  }
});

// GET /api/cities/:id
router.get("/:id", checkId, async (req, res) => {
  try {
    const city = await City.findById(req.params.id);
    if (!city) return res.status(404).json({ error: "City not found" });
    res.json(city);
  } catch (err) {
    res.status(500).json({ error: "Could not load the city" });
  }
});

// POST /api/cities
router.post("/", async (req, res) => {
  try {
    const { name, country, latitude, longitude, unit, note } = req.body;
    const city = await City.create({ name, country, latitude, longitude, unit, note });
    res.status(201).json(city);
  } catch (err) {
    if (isBadData(err)) return res.status(400).json({ error: badDataMessage(err) });
    res.status(500).json({ error: "Could not save the city" });
  }
});

// PUT /api/cities/:id  (the full city is sent again)
router.put("/:id", checkId, async (req, res) => {
  try {
    const { name, country, latitude, longitude, unit, note } = req.body;
    if (!name || !country || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "name, country, latitude and longitude are required" });
    }
    const city = await City.findByIdAndUpdate(
      req.params.id,
      { name, country, latitude, longitude, unit, note },
      { new: true, runValidators: true }
    );
    if (!city) return res.status(404).json({ error: "City not found" });
    res.json(city);
  } catch (err) {
    if (isBadData(err)) return res.status(400).json({ error: badDataMessage(err) });
    res.status(500).json({ error: "Could not update the city" });
  }
});

// DELETE /api/cities/:id
router.delete("/:id", checkId, async (req, res) => {
  try {
    const city = await City.findByIdAndDelete(req.params.id);
    if (!city) return res.status(404).json({ error: "City not found" });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Could not delete the city" });
  }
});

export default router;
