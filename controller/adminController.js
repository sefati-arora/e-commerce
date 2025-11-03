require("dotenv").config();
const express=require("express")
const Joi=require("joi")
const Models=require('../models/index')
const jwt=require("jsonwebtoken")
const helper=require('../helper/validation')
const commonhelper=require('../helper/commonHelper')

module.exports=
{
    category:async(req,res) =>
    {
        try
        {
        const schema=Joi.object({
            title:Joi.string().required()
        });
        const payload=await helper.validationJoi(req.body,schema);
        const user=await Models.categoryModel.create({title:payload.title})
        return res.status(200).json({message:"GET TITLE",user})
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({message:"ERROR"})
    }
    },
    editCategory:async(req,res) =>
    {
      try
      {
         const{id,title}=req.body;
         const user=await Models.categoryModel.findOne({where:{id:id}})
         if(!user)
         {
            return res.status(500).json({message:"CATEGORY NOT FOUND!"})
         }
         const updateUser=await Models.categoryModel.update({
            title,
         },{where:{id}}
        )
        return res.status(200).json({message:"CATEGORY UPDATED!",updateUser})
      }
      catch(error)
      {
        console.log(error)
        return res.status(500).json({message:"ERROR",error})
      }
    },
    deleteCategory:async(req,res) =>
    {
       try
       {
         const{id}=req.body;
         const existing=await Models.categoryModel.destroy({where:{id}})
         return res.status(200).json({message:"DELETED!",existing})
       }
       catch(error)
       {
        console.log(error)
        return res.status(500).json({message:"ERROR"})
       }
    },
    productDetail:async(req,res) =>
    {
        try
        { 
           const schema=Joi.object({
            categoryId:Joi.string().required(),
             title:Joi.string().required(),
             price:Joi.string().required(),
             description:Joi.string().required()
           })
           const payload=await helper.validationJoi(req.body,schema)
           let file=req.files?.file
           if(!file)
           {
            return res.status(404).json({message:"FILE NOT FOUND"})
           }
           if(!Array.isArray(file))
           {
              file=[file]
           }
           for(let i=0;i<file.length;i++)
           {
             const path=await commonhelper.fileUpload(file[i])
             await Models.productModel.create(
                {
                    categoryId:payload.categoryId,
                    title:payload.title,
                    price:payload.price,
                    description:payload.description,
                    images:path
                }
             )
           }
           const userId=req.user.id;
           const usermail=await Models.userModel.findOne({where:{id:userId}})
                 if (usermail && usermail.email) {
                  await commonhelper.sendMail(
                    req,
                    usermail.email,
                    "PRODUCT ADDED!"
                  );
                  console.log(`Purchase EMAIL SENT TO: ${usermail.email}`);
                }
             return res.status(200).json({message:"PRODUCT ENTER BY ADMIN"})
        }
        catch(error)
        {
            console.log(error)
            return res.status(500).json({message:"ERROR"})
        }
    },
    EditProduct:async(req,res) =>
    {
        try
        {
            console.log('req.body',req.body)
           const{categoryId,title,price,description,image}=req.body
           const existuser=await Models.productModel.findOne({where:{categoryId}})
           if(!existuser)
           {
            return res.status(404).json({message:"USER NOT FOUND!"})
           }
           const user=await Models.productModel.update({
            title,
            price,
            description,
            image
           },{where:{categoryId}})
           return res.status(200).json({message:"product Updated By Admin",user})
        }
        catch(error)
        {
            console.log(error)
            return res.status(500).json({message:"ERROR",error})
        }
    },
    deleteProduct:async(req,res) =>
    {
        try
        {
           const{categoryId}=req.body;
           const user=await Models.productModel.destroy({where:{categoryId}})
           return res.status(200).json({message:"DATA DESTROY BY ADMIN",user})
        }
        catch(error)
        {
            console.log()
        }
    }
}