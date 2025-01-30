import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'
import transporter from '../config/nodemailer.js'

export const register = async (req, res) => {
    const {name, email, password} = req.body
    if(!name || !email || !password) {
        return res.json({success: false, message: 'Missing Detail!'})
    }

    try {

        const existingUser = await userModel.findOne({email})
        
        if(existingUser) {
            return res.json({success: false, message: 'User Already Exists!'})
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new userModel({name, email, password: hashedPassword})
        await user.save()

        const tokenSecret = process.env.JWT_SECRET;

        if (!tokenSecret) {
        console.error('JWT_SECRET not found in environment variables!');
        return res.json({ success: false, message: 'Server configuration error.' });
        }

        const token = jwt.sign({id: user._id}, tokenSecret, {expiresIn: '7d'})

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        // Defines email message
        let emailSubject = 'WELCOME!';
        let emailText = `Welcome to Marable's Website! Your account has been created with email id: ${email}`;

        // Check if the email matches a specific user
        if (email === 'piapelaez05@gmail.com') {
            emailSubject = 'Special Welcome!';
            emailText = `Hello Latrell! Welcome to Marable's Website! We are excited to have you on board. Your account has been successfully created with the email id: ${email}.`;
        }

        // Send the email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: emailSubject,
            text: emailText
        };

        await transporter.sendMail(mailOptions)

        return res.json({success: true, message: 'Register Succesfully!'})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const login = async (req, res)=> {
    const {email, password} = req.body

    if(!email || !password) {
        return res.json({success: false, message: 'Email and Password are required!'})
    }

    try {
        const user = await userModel.findOne({email})

        if(!user) {
            return res.json({success: false, message: 'Invalid Email!'})
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch) {
            return res.json({success: false, message: 'Invalid Password!'})
        }

        const tokenSecret = process.env.JWT_SECRET;

        if (!tokenSecret) {
        console.error('JWT_SECRET not found in environment variables!');
        return res.json({ success: false, message: 'Server configuration error.' });
        }

        const token = jwt.sign({id: user._id}, tokenSecret, {expiresIn: '7d'})

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.json({success: true})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',                   
        })

        return res.json({success: true, message: 'Logged Out!'})
    } catch(error) {
        res.json({success: false, message: error.message})
    }
}

// sends otp to users email
export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.json({ success: false, message: 'User ID is required!' });
        }

        const user = await userModel.findById(userId)

        if(user.isAccountVerified) {
            return res.json({success: false, message: "Account is already verified!"})
        }

        const OTP = String(Math.floor(100000 + Math.random() * 900000));

        user.verifyOtp = OTP
        user.verifyOtpExpireAt = Date.now() + (24 * 60 * 60 * 1000)

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${OTP}. Verify your account using this OTP`
        }

        await transporter.sendMail(mailOptions)

        res.json({success: true, message: 'Verification OTP is sent to the email'})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;

    console.log("Received userId:", userId);
  console.log("Received OTP:", otp);

    if (!userId || !otp) {
        return res.json({ success: false, message: "Missing Details!" });
    }

    try {
        const user = await userModel.findById(userId);

        // Check if user exists
        if (!user) {
            return res.json({ success: false, message: "User not found!" });
        }

        // Check if OTP matches and is not expired
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP!" });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired!" });
        }

        // Update user status to verified
        user.isAccountVerified = true;
        user.verifyOtp = '';  // Clear OTP
        user.verifyOtpExpireAt = 0; // Clear expiration time

        // Save the updated user document
        await user.save();

        // Respond with success message
        return res.json({ success: true, message: "Email verified successfully!" });

    } catch (error) {
        // Log error for debugging and return generic error message
        console.error(error);
        return res.json({ success: false, message: "An error occurred while verifying the email. Please try again later." });
    }
}

export const isAuthenticated = async (req, res) => {
    try {
        return res.json({success: true, message: "Account is Authenticated!"})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const sendResetOtp = async (req, res) => {
    const {email} = req.body 
    if(!email) {
        return res.json({success: false, message: "Email is Required!"})
    }

    try {

        const user = await userModel.findOne({email})

        if(!user) {
            return res.json({success: false, message: "User not found!"})
        }

        const OTP = String(Math.floor(100000 + Math.random() * 900000));

        user.resetOtp = OTP
        user.resetOtpExpireAt = Date.now() + (15 * 60 * 1000)

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP is ${OTP}. Reset your password now.`
        }

        await transporter.sendMail(mailOptions)

        return res.json({success: true, message: "Password Reset OTP is sent to your email!"})

    } catch(error) {
        res.json({success: false, message: error.message})
    }
}

export const resetPassword = async (req, res) => {
    const {email, otp, newPassword} = req.body

    if(!email || !otp || !newPassword) {
        return res.json({success: false, message: "Email, OTP, New Password are required!"})
    }

    try {
        const user = await userModel.findOne({email})
        if(!user) {
            return res.json({success: false, message: "User not found!"})
        }

        if(user.resetOtp === '' || user.resetOtp !== otp) {
            return res.json({success: false, message: "Invalid OTP!"})
        }

        if(user.resetOtpExpireAt < Date.now()) {
            return res.json({success: false, message: "OTP Expired!"})
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        user.password = hashedPassword
        user.resetOTP = ''
        user.resetOtpExpireAt = 0

        await user.save();

        return res.json({success: true, message: "Password has been reset successfully!"})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}
