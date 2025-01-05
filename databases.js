//SQL Database connection/set up
const mysql = require('promise-mysql');
var pool;

//Function to create the connection pool
const createPool = async () => {
    //Try to create the pool
    try {
        pool = await mysql.createPool({
            connectionLimit: 3,
            host: 'localhost',  
            user: 'root', //Wampserver default username
            password: 'root', //Wampserver default password
            database: 'proj2024mysql',
        });

        console.log("Database connection pool created");
        return pool;
    }
    catch (error) {
        console.log("Pool creation error: " + error);
        throw error;
    }
};
//Get the connection
const getPool = () => {
    return pool;
};

//Export the functions
module.exports = {
    createPool,
    getPool
};