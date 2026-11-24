const crypto = require("crypto");

const Otp = require("../models/Otp");

const generateOtp = require("../utils/generateOtp");
const hashOtp = require("../utils/hashOtp");
const sendEmail = require("../utils/sendEmail");

const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;


// ===================================
// SEND OTP
// ===================================

const sendOtp = async (req, res) => {

    try {

        const { email } = req.body;

        // 1. Validate email

        if (!email || typeof email !== "string") {

            return res.status(400).json({
                success: false,
                message: "Valid email is required"
            });

        }

        const normalizedEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {

            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });

        }


        // 2. Check existing OTP

        const existingOtp = await Otp.findOne({
            email: normalizedEmail
        });

        const now = new Date();

        if (
            existingOtp &&
            existingOtp.resendAvailableAt > now
        ) {

            return res.status(429).json({
                success: false,
                message: "Please wait before requesting another OTP"
            });

        }


        // 3. Generate OTP

        const otp = generateOtp();


        // 4. Hash OTP

        const otpHash = hashOtp(otp);


        // 5. Calculate expiry

        const expiresAt = new Date(
            Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
        );

        const resendAvailableAt = new Date(
            Date.now() + RESEND_COOLDOWN_SECONDS * 1000
        );


        // 6. Store OTP in database

        const otpRecord = await Otp.findOneAndUpdate(

            { email: normalizedEmail },

            {
                otpHash,
                expiresAt,
                resendAvailableAt,
                attempts: 0
            },

            {
                upsert: true,
                returnDocument: "after",
                runValidators: true,
                setDefaultsOnInsert: true
            }

        );


        // 7. Send OTP email

        try {

            await sendEmail(normalizedEmail, otp);

        } catch (emailError) {

            // Remove the newly generated OTP if email sending fails.
            await Otp.deleteOne({
                _id: otpRecord._id,
                otpHash
            });

            throw emailError;

        }


        // 8. Send response

        return res.status(200).json({

            success: true,

            message: "OTP sent successfully",

            expiresIn: OTP_EXPIRY_MINUTES * 60

        });


    } catch (error) {

        console.error("Send OTP Error:", error);

        return res.status(500).json({

            success: false,

            message: "Unable to send OTP"

        });

    }

};


// ===================================
// VERIFY OTP
// ===================================

const verifyOtp = async (req, res) => {

    try {

        const { email, otp } = req.body;


        // 1. Validate input

        if (
            !email ||
            typeof email !== "string" ||
            typeof otp !== "string" ||
            !/^\d{6}$/.test(otp)
        ) {

            return res.status(400).json({

                success: false,

                message: "Valid email and six-digit OTP are required"

            });

        }


        const normalizedEmail = email.trim().toLowerCase();


        // 2. Find OTP record

        const otpRecord = await Otp.findOne({
            email: normalizedEmail
        });


        if (!otpRecord) {

            return res.status(404).json({

                success: false,

                message: "OTP not found. Please request a new OTP."

            });

        }


        // 3. Check expiration

        if (otpRecord.expiresAt <= new Date()) {

            await Otp.deleteOne({
                _id: otpRecord._id
            });

            return res.status(400).json({

                success: false,

                message: "OTP has expired"

            });

        }


        // 4. Check maximum attempts

        if (otpRecord.attempts >= MAX_ATTEMPTS) {

            await Otp.deleteOne({
                _id: otpRecord._id
            });

            return res.status(429).json({

                success: false,

                message: "Maximum attempts reached. Request a new OTP."

            });

        }


        // 5. Hash the entered OTP

        const enteredOtpHash = hashOtp(otp);


        // 6. Compare hashes securely

        const storedBuffer = Buffer.from(
            otpRecord.otpHash,
            "hex"
        );

        const enteredBuffer = Buffer.from(
            enteredOtpHash,
            "hex"
        );

        const isMatch =
            storedBuffer.length === enteredBuffer.length &&
            crypto.timingSafeEqual(storedBuffer, enteredBuffer);


        if (!isMatch) {

            otpRecord.attempts += 1;

            await otpRecord.save();

            return res.status(400).json({

                success: false,

                message: "Incorrect OTP",

                attemptsRemaining: MAX_ATTEMPTS - otpRecord.attempts

            });

        }


        // 7. OTP is correct: delete it

        await Otp.deleteOne({
            _id: otpRecord._id
        });


        // 8. Return success

        return res.status(200).json({

            success: true,

            message: "Email verified successfully"

        });


    } catch (error) {

        console.error("Verify OTP Error:", error);

        return res.status(500).json({

            success: false,

            message: "OTP verification failed"

        });

    }

};


module.exports = {
    sendOtp,
    verifyOtp
};