const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');

//Import the database functions
const db = require('./databases');//SQL database

//Start server
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});