
// Load environment variables first
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");


// Create Express application
const app = express();


// Middleware
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// Connect MongoDB
connectDB();


// Main route
app.get("/", (req, res) => {

    res.status(200).json({
        message: "Email OTP API is running"
    });

});


// Authentication routes
app.use("/api/auth", authRoutes);


// Global error handler for unexpected errors
app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({
        success: false,
        message: "Internal server error"
    });

});


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});