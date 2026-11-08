import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import api from "./routes/api.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use("/api", api);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.name === "ValidationError" || err.name === "CastError" ? 400 : 500;
  res.status(status).json({ error: err.message });
});

const port = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/crm")
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((e) => { console.error("MongoDB connection failed:", e.message); process.exit(1); });