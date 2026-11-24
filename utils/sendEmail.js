
const transport = require("../config/email");

const sendEmail = async (to, otp) => {

    const mailOptions = {
        from: `"My Application" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: "Your Email Verification OTP",

        text: `Your OTP is ${otp}. It expires in 5 minutes.`,

        html: `
            <div style="
                font-family: Arial;
                padding: 25px;
                background: #f5f5f5;
            ">
                <h2>Email Verification</h2>

                <p>Hello,</p>

                <p>Your verification OTP is:</p>

                <h1 style="
                    color: #2563eb;
                    letter-spacing: 5px;
                ">
                    ${otp}
                </h1>

                <p>This OTP expires in 5 minutes.</p>

                <p>Do not share this OTP with anyone.</p>
            </div>
        `
    };

    const result = await transport.sendMail(mailOptions);

    return result;
};

module.exports = sendEmail;

