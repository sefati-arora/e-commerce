const express=require("express");
const apiController=require('../controller/userController')
const adminControllerr=require('../controller/adminController')
const {authentication}=require('../middleware/authentication')
const router=express.Router();
router.post('/sidIdGenerateTwilio',apiController.sidIdGenerateTwilio)
router.post('/signUp',apiController.signUp),
router.post('/logIn',apiController.logIn),
router.post('/editprofile',authentication,apiController.editprofile)
router.post('/accountDeleted',authentication,apiController.accountDeleted)
router.post('/forgetPassword',authentication,apiController.forgetPassword)
router.post('/changePassword',authentication,apiController.changePassword)
router.post('/logOut',authentication,apiController.logOut)
router.post('/category',authentication,adminControllerr.category)
router.post('/productDetail',authentication,adminControllerr.productDetail)
router.post('/EditProduct',authentication,adminControllerr.EditProduct)
router.post('/deleteProduct',authentication,adminControllerr.deleteProduct)
router.post('/productBuy',authentication,apiController.productBuy)
router.post('/productReview',authentication,apiController.productReview)
router.get('/getproduct',authentication,apiController.getproduct)
router.post('/editCategory',authentication,adminControllerr.editCategory)
router.post('/deleteCategory',authentication,adminControllerr.deleteCategory)
module.exports=router