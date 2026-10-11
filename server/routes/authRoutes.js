const express = require("express");
const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

     

    res.status(201).json({ 
      message: "User registered successfully!" 
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Demo successful response
    res.status(200).json({
      message: "Login successful!",
      token: "demo-jwt-token-12345",
      user: { email, name: email.split("@")[0] }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
});

module.exports = router;