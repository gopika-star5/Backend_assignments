require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());


// User model
const User = mongoose.model("User", new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 }
  },
  { timestamps: true }
));

const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
const makeToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });

// Register: password is encrypted (hashed) before saving
app.post("/api/auth/register", wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ message: "name, email and a password of 6+ characters are required" });
  if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ id: user._id, name: user.name, email: user.email });
}));

// Login: returns a JWT token
app.post("/api/auth/login", wrap(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password || "", user.password)))
    return res.status(401).json({ message: "Invalid email or password" });
  res.json({ token: makeToken(user._id), user: { id: user._id, name: user.name, email: user.email } });
}));

// Middleware: checks the JWT token
const protect = (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "Token missing" });
  try {
    req.userId = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET).id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};


// Note model (each note belongs to one user)
const Note = mongoose.model("Note", new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" }
  },
  { timestamps: true }
));

// CRUD routes - all secured with JWT, and each user sees only their own notes
app.get("/api/notes", protect, wrap(async (req, res) => {
  res.json(await Note.find({ user: req.userId }).sort({ updatedAt: -1 }));
}));

app.post("/api/notes", protect, wrap(async (req, res) => {
  if (!req.body.title) return res.status(400).json({ message: "title is required" });
  res.status(201).json(await Note.create({ user: req.userId, title: req.body.title, content: req.body.content }));
}));

app.put("/api/notes/:id", protect, wrap(async (req, res) => {
  const { title, content } = req.body;
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.userId }, { title, content }, { new: true, runValidators: true }
  );
  if (!note) return res.status(404).json({ message: "Note not found" });
  res.json(note);
}));

app.delete("/api/notes/:id", protect, wrap(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!note) return res.status(404).json({ message: "Note not found" });
  res.json({ message: "Note deleted" });
}));

app.use((err, req, res, next) => {
  if (err.name === "CastError") return res.status(400).json({ message: "Invalid id" });
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5002, () => console.log("API running")))
  .catch(err => console.error("MongoDB connection failed:", err.message));

