const Sequelize = require("sequelize");
const sequelize=new Sequelize("e-commerce","root","password",
    {
        host:"localhost",
        dialect:"mysql"
    }
);

const connectdb=async() =>
{   
    await sequelize.authenticate().then(async()=>
    {
        await sequelize.sync({alter:false});
        console.log("CONNECT DATABASE")
    })
     .catch((error)=>
        {
            console.log("SORRY unable to connect",error)
        }
     )
} 
module.exports=
{
    connectdb:connectdb,
    sequelize:sequelize
}