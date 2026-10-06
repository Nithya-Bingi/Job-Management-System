const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./firebase");

require("dotenv").config();

const app = express();

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
// JWT authentication middleware
function authenticateToken(req, res, next) {

    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access token required"
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {

        if (err) {
            return res.status(403).json({
                message: "Invalid or expired token"
            });
        }

        req.user = user;

        next();
    });
}
console.log("JWT Secret loaded:", !!JWT_SECRET);

app.get("/", (req, res) => {
    res.send("Job Management System API is running!");
});
app.get("/test-firebase", async (req, res) => {

    try {

        await db.ref("test").set({
            message: "Firebase connection successful!"
        });

        res.json({
            message: "Firebase connection successful!"
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});
// Register user
app.post("/register", async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        const usersRef = db.ref("users");

        const newUser = usersRef.push();

        const hashedPassword = await bcrypt.hash(password, 10);

        await newUser.set({
            username: username,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});
// Login user
app.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        const snapshot = await db
            .ref("users")
            .orderByChild("username")
            .equalTo(username)
            .once("value");

        if (!snapshot.exists()) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        let user;

        snapshot.forEach(child => {
            user = {
                id: child.key,
                ...child.val()
            };
        });

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username
            },
            JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            message: "Login successful",
            token: token
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});
app.post("/jobs", async (req, res) => {

    try {

        const { title, company, location, salary, description } = req.body;

        const jobRef = db.ref("jobs").push();

        await jobRef.set({
            title: title,
            company: company,
            location: location,
            salary: salary,
            description: description
        });

        res.status(201).json({
            message: "Job created successfully",
            jobId: jobRef.key
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});
// Get all jobs
app.get("/jobs", async (req, res) => {

    try {

        const snapshot = await db.ref("jobs").once("value");

        const jobs = snapshot.val();

        res.json(jobs || {});

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});
// Update a job
app.put("/jobs/:id", async (req, res) => {

    try {

        const jobId = req.params.id;

        const { title, company, location, salary, description } = req.body;

        const jobRef = db.ref("jobs/" + jobId);

        const snapshot = await jobRef.once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        await jobRef.update({
            title: title,
            company: company,
            location: location,
            salary: salary,
            description: description
        });

        res.json({
            message: "Job updated successfully"
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});
// Delete a job
app.delete("/jobs/:id", async (req, res) => {

    try {

        const jobId = req.params.id;

        const jobRef = db.ref("jobs/" + jobId);

        const snapshot = await jobRef.once("value");

        if (!snapshot.exists()) {
            return res.status(404).json({
                message: "Job not found"
            });
        }

        await jobRef.remove();

        res.json({
            message: "Job deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});