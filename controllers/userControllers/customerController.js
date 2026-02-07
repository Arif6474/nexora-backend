import Customer from "#models/userModels/customerModel.js";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
const { genSalt, hash, compare } = bcrypt
const { verify } = jwt
import { generateToken } from '#utils/helperFunction.js'
import { sendForgotPasswordMail } from "#config/email/emailFormats/sendMail.js";

import {
  archiveDocument,
  createDocument,
  deleteDocument,
  getAllDocuments,
  getDocumentsWithQuery,
  getSingleDocument,
  updateDocument
} from '#crudServices/crudServices.js';
import asyncHandler from 'express-async-handler';

const registerCustomer = async (req, res) => {
  try {
    const { name, phone, email, password, confirmPassword } = req.body;

    if (!name || !phone || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const salt = await genSalt(10)
    const hashedPassword = await hash(password, salt)

    const customer = new Customer({
      name,
      phone,
      email,
      password: hashedPassword,
    });

    await customer.save();
    const token = generateToken(customer._id);

    res.status(201).json({
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const loginCustomer = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await compare(password, customer.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(customer._id);

    res.status(200).json({
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      image: customer.image,
      address: customer.address,
      bio: customer.bio,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const token = generateToken(customer._id);
    const resetLink = `${process.env.CONSUMER_APP_LINK}/reset-password/${token}`;
    await sendForgotPasswordMail(customer.email, resetLink);

    res.status(200).json({ message: "Password reset token sent", token });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const salt = await genSalt(10);
    const hashedPassword = await hash(newPassword, salt);

    customer.password = hashedPassword;
    await customer.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
}
const getEmailFromToken = async (req, res) => {

  const { token } = req.params;
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }
  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ email: customer.email });
  } catch (error) {
    console.error("Get email from token error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

const loginWithGoogle = async (req, res) => {
  const { email, name, phone, image } = req.body;

  console.log(email, name, phone, image, 'loginWithGoogle called');
  if (!email || !name) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    let customer = await Customer.findOne({ email });

    if (!customer) {
      customer = new Customer({
        name,
        phone,
        email,
        password: null,
        image
      });
      await customer.save();
    }

    const token = generateToken(customer._id);

    res.status(200).json({
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      image: customer.image,
      address: customer.address,
      bio: customer.bio,
      token,
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

const updateProfile = async (req, res) => {
  const customerId = req.customer._id;

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
  }
  const updateProfileData = await Customer.findByIdAndUpdate(customerId, req.body, { new: true }).select('-password -__v');
  res.status(200).json(updateProfileData);
}


export {
  loginCustomer,
  registerCustomer,
  forgotPassword,
  resetPassword,
  getEmailFromToken,
  loginWithGoogle,
  updateProfile,

}