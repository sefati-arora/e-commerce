const Sequelize=require("sequelize");
const sequelize=require('../config/connectdb').sequelize;

module.exports=
{
    userModel:require('./userModel')(Sequelize,sequelize,Sequelize.DataTypes),
    categoryModel:require('./categoryModel')(Sequelize,sequelize,Sequelize.DataTypes),
    productModel:require('./productModel')(Sequelize,sequelize,Sequelize.DataTypes),
    productBuyModel:require('./productBuyModel')(Sequelize,sequelize,Sequelize.DataTypes),
    reviewModel:require('./reviewModel')(Sequelize,sequelize,Sequelize.DataTypes)
}