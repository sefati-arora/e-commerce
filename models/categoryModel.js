module.exports=(Sequelize,sequelize,DataTypes)=>
{
    return sequelize.define(
        "categorytable",
        {
            ...require('./core')(Sequelize,DataTypes),
            title:
            {
                type:DataTypes.STRING(225),
                allowNull:true
            }
        },
        {
            tableName:"categorytable"
        }
    )
}