const express = require('express');
const app = express();
const port = 3004;
const bodyParser = require('body-parser');
let ejs = require('ejs');

//Middleware
app.set('view engine', 'ejs');//Set the view engine to EJS
app.use(bodyParser.urlencoded({ extended: true }));//Parse URL-encoded bodies
app.use(bodyParser.json());//Used to parse JSON bodies

//Import the database functions
const db = require('./databases');//SQL and MongoDB functions and database

//SQL connection
db.createPool()
    .then(() => {
        console.log("Database connection pool created");
    })
    .catch((error) => {
        console.log("Failed to create database pool: " + error);
    });
//MongoDB connection
db.connectToMongo()
    .then(() => {
        console.log("MongoDB connection established");
    })
    .catch((error) => {
        console.log("Failed to connect to MongoDB: " + error);
    });

//Routes
//Home page
app.get('/', (req, res) => {
    console.log("GET request on /");
    res.render('home');
});
//Display students
app.get('/students', async (req, res) => {
    console.log("GET request on /students");
    try {
        const pool = db.getPool();
        const result = await pool.query('SELECT * FROM student ORDER BY sid');
        res.render('students', {
            students: result,
            message: req.query.message
        });
    } catch (err) {
        res.status(500).send("Database error: " + err);
    }
});
//Edit students GET
app.get('/students/edit/:sid', async (req, res) => {
    console.log("GET request on /students/edit/" + req.params.sid);
    try {
        const pool = db.getPool();
        const result = await pool.query('SELECT * FROM student WHERE sid = ?', [req.params.sid]);
        if (result.length > 0) {
            res.render('editStudents', {
                student: result[0],
                error: null,
                previousData: null
            });
        } else {
            res.redirect('/students?message=Student not found');
        }
    } catch (err) {
        res.status(500).send("Database error: " + err);
    }
});
//Handle student update POST
app.post('/students/edit/:sid', async (req, res) => {
    console.log("POST request on /students/edit/" + req.params.sid);
    const { name, age } = req.body;
    let error = null;

    //Validation
    if (!name || name.length < 2) {
        error = "Name should be a minimum of 2 characters";
    } else if (!age || age < 18) {
        error = "Age should be 18 or older";
    }

    if (error) {
        return res.render('editStudents', {
            student: { sid: req.params.sid, name, age },
            error: error,
            previousData: req.body
        });
    }

    try {
        const pool = db.getPool();
        await pool.query('UPDATE student SET name = ?, age = ? WHERE sid = ?',
            [name, age, req.params.sid]);
        res.redirect('/students');
    } catch (err) {
        res.status(500).send("Database error: " + err);
    }
});
//Add student page GET
app.get('/students/add', (req, res) => {
    console.log("GET request on /students/add");
    res.render('addStudent', { errors: [], previousData: null });
});

//Handle add student POST
app.post('/students/add', async (req, res) => {
    console.log("POST request on /students/add");
    const { sid, name, age } = req.body;
    let errors = []; //Array to store errors

    //Validation - add to the array if there is an error
    if (!sid || sid.length !== 4) {
        errors.push("Student ID must be 4 characters");
    }
    if (!name || name.length < 2) {
        errors.push("Name should be a minimum of 2 characters");
    }
    if (!age || age < 18) {
        errors.push("Age should be 18 or older");
    }

    if (errors.length > 0) {
        return res.render('addStudent', {
            errors: errors,
            previousData: req.body
        });
    }

    try {
        const pool = db.getPool();
        //Check if student ID already exists
        const existing = await pool.query('SELECT * FROM student WHERE sid = ?', [sid]);
        if (existing.length > 0) {
            errors.push(`Student with ID ${sid} already exists`);
            return res.render('addStudent', {
                errors: errors,
                previousData: req.body
            });
        }
        //Add new student to the database
        await pool.query('INSERT INTO student (sid, name, age) VALUES (?, ?, ?)',
            [sid, name, age]);
        res.redirect('/students');
    } catch (err) {
        errors.push("Database error: " + err);
        return res.render('addStudent', {
            errors: errors,
            previousData: req.body
        });
    }
});

//Get grades GET
app.get('/grades', async (req, res) => {
    console.log("GET request on /grades");
    try {
        const pool = db.getPool();

        // Useing LEFT JOIN to include students with no modules
        // Order by student name and grade in ASC order
        const query = `
            SELECT 
                s.name AS studentName,
                m.name AS moduleName,
                g.grade
            FROM student s
            LEFT JOIN grade g ON s.sid = g.sid
            LEFT JOIN module m ON g.mid = m.mid
            ORDER BY s.name ASC, g.grade ASC
        `;

        const results = await pool.query(query);

        //Display and render the grades
        res.render('viewGrades', {
            grades: results
        });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error: " + err);
    }
});

//Get lecturers GET
app.get('/lecturers', async (req, res) => {
    try {
        const lecturers = await db.getAllLecturers();
        res.render('lecturers', {
            lecturers: lecturers,
            error: null
        });
    } catch (error) {
        res.status(500).send("Database error: " + error);
    }
});
//Delete lecturer GET
app.get('/lecturers/delete/:lid', async (req, res) => {
    try {
        await db.deleteLecturer(req.params.lid);
        res.redirect('/lecturers');
    } catch (error) {
        //Get all lecturers again to re-render the page with error
        const lecturers = await db.getAllLecturers();
        res.render('lecturers', {
            lecturers: lecturers,
            error: error.message
        });
    }
});

//Start server
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});