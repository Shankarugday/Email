const express = require("express");

const router = express.Router();

const {
    sendOtp,
    verifyOtp
} = require("../controllers/authController");


// Send OTP API
router.post("/send-otp", sendOtp);


// Verify OTP API
router.post("/verify-otp", verifyOtp);


module.exports = router;