const crypto=require("crypto");

const hashOtp=(otp)=> {
    return crypto
    .createHmac("sha256",process.env.OTP_SECRET)
    .update(otp)
    .digest("hex");
};

module.exports=hashOtp;