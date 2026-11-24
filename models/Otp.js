const mongoose=require("mongoose");

const otpSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    otpHash:{
        type:String,
        required:true
    },
    expireAt:{
        type:Date,
        required:true
    },
    resendAvailableAt:{
        type:Date,
        required:true
    },
    attempts:{
        type:Number,
        default:0
    }
},
{
    timestamps:true
});

module.exports=mongoose.model("Otp",otpSchema);