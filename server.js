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
app.post("/user/add", function (req, res) {
    console.log("post user add", req.body);
    let name = req.body.name;
    db.User.find({ name: name }, { name: 1 }).limit(1)
        .then(function (userRecords) {
            console.log(userRecords);
            if (userRecords.length) {
                console.log("user exists already; cannot add user");
            }
            else {
                console.log("new user; adding to database");
                db.User.create({
                    name: req.body.name,
                    password: req.body.password,
                    email: req.body.email
                })
            }
        })
});

//get route to get only one user's data
app.get("/get/user", function (req, res) {
    db.User.findOne({
        name: req.body.name
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

app.put("/bio", function (req, res) {
    db.User.findOne({

    })
})

app.post("/", function (req, res) {
    res.json('POST');
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});