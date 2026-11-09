import "dotenv/config"; // first line, before anything reads process.env
import express from "express";
import mongoose from "mongoose";
import citiesRouter from "./routes/cities.js";

const dbUri = process.env.MONGODB_URI;
const port = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Weather Dashboard API", routes: "/api/cities" });
});

app.use("/api/cities", citiesRouter);

// Unknown route
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Malformed JSON body, or any error a route didn't catch
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

// Connect first, then listen
try {
  await mongoose.connect(dbUri);
  console.log("connected to MongoDB");
  app.listen(port, () => console.log(`API listening on :${port}`));
} catch (err) {
  console.error("DB connection failed:", err.message);
  process.exit(1);
}
