const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const axios = require("axios");
const moment = require('moment');

// Require all models
var db = require("./models");

const PORT = process.env.PORT || 8080;

// Initialize Express
const app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/StumpAround";
// // Connect to the Mongo DB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

//post route to add hikes to database from API
app.post("/hikes", function (req, res) {
    axios.get('https://www.hikingproject.com/data/get-trails?lat=45.52345&lon=-122.67621&maxDistance=500&maxResults=&key=200649274-302d66556efb2a72c44c396694a27540')
        .then(function (response) {
            // console.log(response.data.trails);
            let trailsData = response.data.trails;
            for (let i = 0; i < trailsData.length; i++) {
                db.Hike.create({
                    apiId: trailsData[i].id,
                    name: trailsData[i].name,
                    location: trailsData[i].location,
                    summary: trailsData[i].summary,
                    photo: trailsData[i].imgSmall,
                    length: trailsData[i].length
                })
                    .catch(function (err) {
                        if (err.errmsg.substr(0, 6) === "E11000") {
                            console.log("id already exists");
                        }
                        else {
                            console.log("other error");
                        }
                    })
            }
        })
    res.redirect("/hikes");
});

//get call to get all hikes from database
app.get("/hikes", function (req, res) {
    db.Hike.find({})
        .then(function (records) {
            res.json(records);
        })
});

//get call to grab only one hike from database
app.get("/hike/:id", function (req, res) {
    console.log("serverside ID is: ", req.params.id);
    db.Hike.findOne({ _id: req.params.id })
        .populate("comment")
        .then(function (hikeRecord) {
            res.json(hikeRecord);
        })
        .catch(function (err) {
            res.json(err);
        });
});

//post route to add a user to the database
app.post("/user/:username/:password/:email", function (req, res) {
    let name = req.params.username;
    let password = req.params.password;
    let email = req.params.email;

    db.User.find({})
        .then(function (userRecords) {
            for (let i = 0; i < userRecords.length; i++) {
                if (!(name === userRecords[i].name) && !(email === userRecords[i].email)) {
                    db.User.create({
                        name,
                        password,
                        email,
                    })
                }
                else {
                    console.log("Cannot create new user");
                }
            }
        })
});

//get route to get only one user's data
app.get("/user/:username", function (req, res) {
    let name = req.params.username;
    db.User.findOne({
        name: name
    })
        .populate("comments")
        .populate("hikes")
        .then(function (userRecord) {
            res.json(userRecord);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.post("/", function (req, res) {
    res.json('POST');
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});