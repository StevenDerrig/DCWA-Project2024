//SQL Database connection/set up
const mysql = require('promise-mysql');
var pool;
//MongoDB connection/set up
const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017';
const dbName = 'proj2024MongoDB';
let mongoClient;
let mongoDB;

//Function to create the connection pool SQL
const createPool = async () => {
    //Try to create the pool and connect to proj2024mysql
    try {
        pool = await mysql.createPool({
            connectionLimit: 3,
            host: 'localhost',
            user: 'root', //Wampserver default username
            password: 'root', //Wampserver default password
            database: 'proj2024mysql',
        });

        console.log("SQL Database connection pool created");
        return pool;
    }
    catch (error) {
        console.log("SQL Pool creation error: " + error);
        throw error;
    }
};
//Get the connection
const getPool = () => {
    return pool;
};

//Function to create the connection pool MongoDB
const connectMongo = async () => {
    //Try to cconnect to project2024MongoDB
    try {
        mongoClient = await MongoClient.connect(url);
        mongoDB = mongoClient.db(dbName);
        console.log("MongoDB connected successfully");
        return mongoDB;
    } catch (error) {
        console.log("MongoDB connection error: " + error);
        throw error;
    }
};
//Return the MongoDB connection
const getMongoDB = () => {
    return mongoDB;
};
//Find all lectures in the project2024MongoDB database
const getAllLecturers = async () => {
    try {
        const collection = mongoDB.collection('lecturers');
        return await collection.find({}).toArray();
    } catch (error) {
        console.log("Error getting lecturers: " + error);
        throw error;
    }
};
//Delete a lecturer from the database
const deleteLecturer = async (lid) => {
    try {
        //Check if lecturer teaches any modules using MySQL
        const modules = await pool.query('SELECT * FROM module WHERE lecturer = ?', [lid]);

        if (modules.length > 0) {
            throw new Error('Cannot delete lecturer who teaches modules');
        }

        //If they have no modules, delete from MongoDB
        const collection = mongoDB.collection('lecturers');
        const result = await collection.deleteOne({ _id: lid });

        if (result.deletedCount === 0) {
            throw new Error('Lecturer not found');
        }

        return result;
    } catch (error) {
        console.log("Error deleting lecturer: " + error);
        throw error;
    }
};
//Export the functions
module.exports = {
    //SQL functions
    createPool,
    getPool,
    //MongoDB functions
    connectMongo,
    getMongoDB,
    getAllLecturers,
    deleteLecturer
};