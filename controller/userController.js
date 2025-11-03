require("dotenv").config();
const Models = require("../models/index");
const express = require("express");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const helper = require("../helper/validation");
const commonhelper = require("../helper/commonHelper");
const argon2 = require("argon2");
const commonHelper = require("../helper/commonHelper");
const otpManager = require("node-twillo-otp-manager")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
  process.env.TWILIO_SERVICE_SID
);

module.exports = {
  sidIdGenerateTwilio: async (req, res) => {
    try {
      const serviceSid = await otpManager.createServiceSID("Test", "4");
      console.log("Service SID created:", serviceSid);
      return serviceSid;
    } catch (error) {
      console.error("Error generating Service SID:", error);
      throw new Error("Failed to generate Service SID");
    }
  },
  signUp: async (req, res) => {
    try {
      const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        countryCode: Joi.string().required(),
        email: Joi.string().required(),
        password: Joi.string().required(),
      });
      const payload = await helper.validationJoi(req.body, schema);
      const { password } = payload;
      const hashpassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
      const user = await Models.userModel.create({
        firstName: payload.firstName,
        lastName: payload.lastName,
        phoneNumber: payload.phoneNumber,
        countryCode: payload.countryCode,
        email: payload.email,
        password: hashpassword,
      });
      if (user) {
        const phone = payload.countryCode + payload.phoneNumber;
        let response = await otpManager.sendOTP(phone);
        console.log(`✅ OTP sent successfully to ${payload.phoneNumber}`);
        console.log(response);
      }
      const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
      console.log(process.env.SECRET_KEY);
      return res
        .status(200)
        .json({ message: "USER SIGNUP SUCCESSFULLY!", user, token });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  logIn: async (req, res) => {
    try {
      const schema = Joi.object({
        email: Joi.string()
          .email({ tlds: { allow: ["com", "net", "org", "in", "us"] } })
          .required()
          .label("Email"),
        password: Joi.string().required(),
      });
      const payload = await helper.validationJoi(req.body, schema);
      const { email, password } = payload;
      const userExist = await Models.userModel.findOne({
        where: { email: email },
      });
      if (!userExist) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      const otp = Math.floor(1000 + Math.random() * 9000);
      const hashpassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
      const user = await Models.userModel.create({
        email,
        password: hashpassword,
        otp,
        otpVerified: 0,
      });
      try {
        await commonHelper.otpSendLinkHTML(req, email, otp);
        console.log(`OTP sent (${email}): ${otp}`);
      } catch (error) {
        await Models.userModel.destroy({ where: { id: user.id } });
        return res.status(400).json({ message: "Failed to send OTP" });
      }
      const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY);
      return res
        .status(200)
        .json({ message: "OTP SEND SUCCESSFULLY", user, token });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  editprofile: async (req, res) => {
    try {
      const user = req.user;
      console.log("req.user", user);
      const id = req.user.id;
      console.log(">>>", id);
      const { firstName, lastName, phoneNumber, email } = req.body;
      const profile = await Models.userModel.findAll({ where: { id: id } });
      if (!profile) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      await Models.userModel.update(
        { firstName, lastName, phoneNumber, email },
        { where: { id } }
      );
      return res
        .status(200)
        .json({ message: "PROFILE UPDATED SUCCESSFULLY!", user });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR", error });
    }
  },
  accountDeleted: async (req, res) => {
    try {
      const id = req.user.id;
      const user = await Models.userModel.destroy({ where: { id: id } });
      return res.status(200).json({ message: "DATA DELETED!", user });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR" });
    }
  },
  forgetPassword: async (req, res) => {
    try {
      const schema = Joi.object({
        email: Joi.string()
          .email({ tlds: { allow: ["com", "net", "org", "in", "us"] } })
          .required()
          .label("Email"),
        password: Joi.string().required(),
      });
      const payload = await helper.validationJoi(req.body, schema);
      const { email, password } = payload;
      const otp = Math.floor(1000 + Math.random() * 9000);
      const hashpassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
      const user = await Models.userModel.create({
        email,
        password: hashpassword,
        otp,
        otpVerified: 0,
      });
      try {
        await commonHelper.otpSendLinkHTML(req, email, otp);
        console.log(`OTP sent (${email}): ${otp}`);
      } catch (error) {
        await Models.userModel.destroy({ where: { id: user.id } });
        return res.status(400).json({ message: "Failed to send OTP" });
      }
      return res
        .status(200)
        .json({ message: "GET YOUR OTP FOR PASSWORD", user });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ messagte: "ERROR", error });
    }
  },
  changePassword: async (req, res) => {
    try {
      const schema = Joi.object({
        oldpassword: Joi.string().required(),
        newpassword: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref("newpassword")).required(),
      });
      const payload = await helper.validationJoi(req.body, schema);
      const { oldpassword, newpassword } = payload;
      const id = req.user.id;
      const user = await Models.userModel.findOne({ where: { id } });
      if (!user) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      console.log("hash", user.password);
      console.log(">>>>", oldpassword);
      const validpassword = await argon2.verify(
        user.password.trim(),
        oldpassword.trim()
      );
      if (!validpassword) {
        return res.status(404).json({ message: "INVALID PASSWORD" });
      }
      const hashedPassword = await argon2.hash(newpassword, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
      const existuser = await Models.userModel.update(
        { password: hashedPassword },
        { where: { id: id } }
      );
      return res.status(200).json({ message: "PASSWORD CHANGED!", existuser });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR" });
    }
  },
  logOut: async (req, res) => {
    try {
      const user = req.user;
      console.log(">>", req.user);
      const id = req.user.id;
      const existuser = await Models.userModel.findOne({
        where: { id: user.id },
      });
      if (!existuser) {
        return res.status(404).json({ message: "USER NOT FOUND!" });
      }
      await Models.userModel.update({ devicetoken: null }, { where: { id } });
      return res
        .status(200)
        .json({ message: "USER SUCCESSFULLY LOGOUT!", existuser });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "" });
    }
  },
  getproduct:async(req,res) =>
  {
    try
    {
      console.log(">>>",req.body)
       const{categoryId}=req.body;
       const user=await Models.productModel.findOne({where:{categoryId}})
       return res.status(200).json({message:"PRODUCT GET",user})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR"})
    }
  },
  productBuy: async (req, res) => {
    try {
      const userId = req.user.id;
      if (!userId) {
        return res.status(404).json({ message: "PLEASE CREATE YOUR ACCOUNT" });
      }
      const schema = Joi.object({
        productId:Joi.string().required(),
        Amount: Joi.number().required(),
      });
      const payload = await helper.validationJoi(req.body, schema);
      const user = await Models.productBuyModel.create({
        userId,
        productId:payload.productId,
        Amount: payload.Amount,
      });
      const usermail = await Models.userModel.findOne({
        where: { id: userId },
      });
      if (usermail && usermail.email) {
        await commonhelper.sendMail(
          req,
          usermail.email,
          "Purchase Confirmation"
        );
        console.log(`Purchase EMAIL SENT TO: ${usermail.email}`);
      }
      return res
        .status(200)
        .json({ message: "USER BUY THIS SUCCESSFULLY!", user });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "ERROR" });
    }
  },
  productReview:async(req,res) =>
  {
    try
    {
      const userId=req.user.id;
      if(!userId)
      {
        return res.status(404).json({message:"PLEASE CREATE YOUR ACCOUNT FIRST"})
      }
      const schema=Joi.object({
           productId:Joi.string().required(),
           message:Joi.string().required()
      })
      const payload=await helper.validationJoi(req.body,schema)
      const user=await Models.reviewModel.create(
        {
          userId,
          productId:payload.productId,
          message:payload.message
        }
      )
      const usermail=await Models.userModel.findOne({where:{id:userId}})
       if (usermail && usermail.email) {
        await commonhelper.sendMail(
          req,
          usermail.email,
          "REVIEW MAIL"
        );
        console.log(`Purchase EMAIL SENT TO: ${usermail.email}`);
      }
      return res.status(200).json({message:"USER'S REVIEW GET",user})
    }
    catch(error)
    {
      console.log(error)
      return res.status(500).json({message:"ERROR"})
    }
  }
};
