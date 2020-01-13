require('dotenv').config();
const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const axios = require("axios");
const moment = require('moment');
const multer = require('multer');
const fs = require('fs');
const uuidv1 = require('uuid/v1');
const path = require('path');
const User = require('./models/User.js');
const secret = process.env.SECRET;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const withAuth = require('./middleware');
// Require all models
var db = require("./models");
const handleError = (err, res) => {
    console.log('in hndlerrfn', err);
    res
      .status(500)
      .contentType("text/plain")
      .end("Oops! Something went wrong!");
  };

const upload = multer({dest: __dirname + '/uploads/temp'});
// const storage = multer.memoryStorage()
// const upload = multer({ storage: storage })

const PORT = process.env.PORT || 8080;

// Initialize Express
const app = express();
app.use(cookieParser());
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
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useFindAndModify: false });

// POST route to register a user
app.post('/api/register', function (req, res) {
    const { email, password, name } = req.body;
    const user = new User({ email, password, name });
    user.save(function (err) {
        if (err) {
            res.status(500)
                .json({ error: 0 });
        } else {
            res.status(200).json({ success: 1 })
        }
    });
});

app.post('/api/authenticate', function (req, res) {
    const { email, password } = req.body;
    User.findOne({ email }, function (err, user) {
        if (err) {
            console.error(err);
            res.status(500)
                .json({
                    error: 'Internal error try again'
                });
        } else if (!user) {
            res.status(401)
                .json({
                    error: 'Incorrect email or password'
                });
        } else {
            user.isCorrectPassword(password, function (err, same) {
                if (err) {
                    res.status(500)
                        .json({
                            error: 'Internal error try again'
                        });
                } else if (!same) {
                    res.status(401)
                        .json({
                            error: 'Incorrect email or password'
                        });
                } else {
                    const payload = { email };
                    const token = jwt.sign(payload, secret, {
                        expiresIn: '1h'
                    });
                    res.json({token, userId: user._id})
                }
            })
        }
    })
})

//get route to get only one user's data
app.post("/user/secure", withAuth, function (req, res) {
    db.User.findOne({
        email: req.email
    })
        .select('-password')
        .populate("comments")
        .populate({
            path: "profileComments",
            populate: {
                path: 'user',
                select: '-password -sentRequests -receivedRequests'
            }
        })
        .populate({
            path: "friends",
            populate: {
                path: 'user',
                select: '-password -sentRequests -receivedRequests'
            }
        })
        .populate({
            path: "sentRequests",
            populate: {
                path: 'user',
                select: '-password -sentRequests -receivedRequests'
            }
        })
        .populate({
            path: "receivedRequests",
            populate: {
                path: 'user',
                select: '-password -sentRequests -receivedRequests'
            }
        })
        .populate("hikes")
        .then(function (userRecord) {
            res.json(userRecord);
        })
        .catch(function (err) {
            res.json(err);
        });
});

//post route to add hikes to database from API
app.post("/hikes", function (req, res) {
    axios.get('https://www.hikingproject.com/data/get-trails?lat=45.52345&lon=-122.67621&maxDistance=500&maxResults=500&key=200649274-302d66556efb2a72c44c396694a27540')
        .then(function (response) {
            // console.log(response.data.trails);
            let trailsData = response.data.trails;
            for (let i = 0; i < trailsData.length; i++) {
                db.Hike.create({
                    apiId: trailsData[i].id,
                    name: trailsData[i].name,
                    location: trailsData[i].location,
                    summary: trailsData[i].summary,
                    photo: trailsData[i].imgMedium,
                    length: trailsData[i].length,
                    latitude: trailsData[i].longitude,
                    longitude: trailsData[i].longitude,     
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
        .populate({
            path: "comments",
            populate: {
                path: 'user',
                select: '-password -sentRequests -receivedRequests'
            }
        })
        .then(function (hikeRecord) {
            res.json(hikeRecord);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get('/image/:id', (req, res) => {
    db.Image.findOne({'_id': req.params.id })
    .then((result) => {  
        res.set('Content-Type', result.contentType);
        res.send(Buffer.from(result.image.buffer)); 
      })
      .catch(function (err) {
        res.json(err);
        });
    })
//AIzaSyCxVNFOHr5A41exxwglh7c4BnKxEa2DoIc
//post route to add stump to database
app.post("/stump", withAuth, function(req, res) {
    db.User.findOne({
        email: req.email
    })
    .then((foundProfile) => {
        return db.Stump.create({
                name: req.body.name,
                summary: req.body.summary,
                user: foundProfile._id,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                tags: req.body.tags,
        })
        .then((newStump) => {
            res.json(newStump._id);
        })
    })
    .catch(function (err) {
        console.log(err);
        res.json({ error: 1 })
    })
})
app.put("/stump/image/:stumpid", withAuth, upload.single('file'), function (req, res) {
    if (!req.file) {
        console.log("No photo received");
        res
        .status(403)
        .contentType("text/plain")
        .end("No photo received");
    } else {
        db.User.findOne({
            email: req.email
        })
        .then((foundUser) => {
            const imageFile = fs.readFileSync(req.file.path);
            const encode_image = imageFile.toString('base64');
            const finalImg = {
                contentType: req.file.mimetype,
                image:  new Buffer.from(encode_image, 'base64')
            };
            db.Image.create({ ...finalImg, user: foundUser._id})
            .then((createdImage) => {
                db.Stump.findOneAndUpdate({
                    _id: req.params.stumpid
                }, {
                    photo: `http://stump-around.herokuapp.com/image/${createdImage._id}`
                })
                .then((result) => {
                    res.json({ success: 1 });
                })
            })
        })
        .catch(function (err) {
                console.log("An error has occurred.");
                res.json({ error: 1 })
        })
    }
});

//post route to add stump to database
// app.put("/stump/photo", withAuth, upload.single('file'), function (req, res) {
//     const hash = uuidv1();
//     let userId;
//     if (!req.file) {
//         console.log("No photo received");
//         res
//         .status(403)
//         .contentType("text/plain")
//         .end("No photo received");
//     } else {
//         console.log('file received');
//         return db.User.findOne({
//             email: req.email
//         })
//         .then((foundProfile) => {
//             console.log('found:', foundProfile);
//             userId = foundProfile._id;
//             return db.Stump.create({
//                 name: req.body.name,
//                 summary: req.body.summary,
//                 user: foundProfile._id,
//                 photo: `http://stump-around.herokuapp.com/photo/${userId}${hash}`,
//                 latitude: req.body.latitude,
//                 longitude: req.body.longitude,
//             })
//         })
//         .then((createdStump) => {
//                 console.log('updated:', createdStump);
//                 const tempPath = req.file.path;
//                 const targetPath = path.join(__dirname, `./uploads/images/${userId}${hash}.jpg`);
//                 fs.rename(tempPath, targetPath, err => {
//                     if (err) return handleError(err, res);
            
//                     res
//                     .status(200)
//                     // .contentType("text/plain")
//                     .json(createdStump);
//                 });
//         })
//         .catch(function (err) {
//                 console.log("An error has occurred.");
//         })
//     }
// });

//get call to get all stumps from database
app.get("/stumps", function (req, res) {
    db.Stump.find({})
        .then(function (records) {
            res.json(records);
        })
});

//get call to grab only one stump from database
app.get("/stump/:id", function (req, res) {
    console.log("serverside ID is: ", req.params.id);
    db.Stump.findOne({ _id: req.params.id })
        .populate('user')
        .populate({
            path: "comments",
            populate: {
                path: 'user',
                select: '-password -sentRequests -receivedRequests'
            }
        })
        .then(function (stumpRecord) {
            res.json(stumpRecord);
        })
        .catch(function (err) {
            res.json(err);
        });
});


//get route to get only one user's data
app.post("/user/:id", withAuth, function (req, res) {
    db.User.findOne({
        email: req.email
    })
    .then((queryingUser) => {
        db.User.findOne({
            _id: req.params.id
        })
        .then((foundUser) => {
            console.log(foundUser.friends);
            console.log(typeof foundUser.friends);
            if (foundUser.friends.includes(queryingUser._id)) {
                foundUser
                .select('-password -sentRequests -receivedRequests')
                .populate("comments")
                .populate({
                    path: "profileComments",
                    populate: {
                        path: 'user',
                        select: '-password -sentRequests -receivedRequests'
                    }
                })
                .populate({
                    path: "friends",
                    populate: {
                        path: 'user',
                        select: '-password -sentRequests -receivedRequests'
                    }
                })
                .populate("hikes")
                .then(function (userRecord) {
                    console.log('friend', userRecord);
                    res.json(userRecord);
                })
            }
            else {
                foundUser
                .select('-password -sentRequests -receivedRequests -profileComments -hikes')
                .populate({
                    path: "friends",
                    populate: {
                        path: 'user',
                        select: '-password -sentRequests -receivedRequests'
                    }
                })
                .then(function (userRecord) {
                    console.log('denied', userRecord);
                    let limitedAccess = { ...userRecord, profileComments: 'denied', hikes: 'denied' }
                    res.json(limitedAccess);
                })
            }
        })
        .catch(function (err) {
            res.json(err);
        });
    })
    .catch(function (err) {
        res.json(err);
    });
});

app.post("/sendRequest", withAuth, function(req, res) {
    db.User.findOneAndUpdate({
        email: req.email
    },
    {
        $addToSet: { sentRequests: req.body._id }
    },
    { 
        new: true, upsert: true
    })
    .then((foundUser) => {
        db.User.findOneAndUpdate({
            _id: req.body._id
        },
        {
            $addToSet: { receivedRequests: foundUser._id }
        },
        { 
            new: true, upsert: true 
        })
        .then((newPotentialFriend) => {
            res.json(newPotentialFriend);
        })
    })
    .catch(function (err) {
        res.json(err);
    });
})

app.post("/acceptRequest", withAuth, function(req, res) {
    db.User.findOneAndUpdate({
        email: req.email
    },
    {
        $addToSet: { friends: req.body._id },
        $pull: { receivedRequests: req.body._id }
    },
    { 
        new: true, upsert: true
    })
    .then((foundUser) => {
        db.User.findOneAndUpdate({
            _id: req.body._id
        },
        {
            $addToSet: { friends: foundUser._id },
            $pull: { sentRequests: foundUser._id }
        },
        { 
            new: true, upsert: true
        })
        .then((newFriend) => {
            res.json(newFriend);
        })
    })
    .catch(function (err) {
        res.json(err);
    });
})

app.delete("/removeFriend", withAuth, function(req, res) {
    db.User.findOneAndUpdate({
        email: req.email
    },
    {
        $pull: { friends: req.body._id }
    },
    { 
        new: true 
    })
    .then((foundUser) => {
        db.User.findOneAndUpdate({
            _id: req.body._id
        },
        {
            $pull: { friends: foundUser._id }
        },
        { 
            new: true 
        })
        .then((removedFriend) => {
            res.json(removedFriend);
        })
    })
    .catch(function (err) {
        res.json(err);
    });
})

app.get('/api/secret', withAuth, function(req, res) {
    res.send('YES');
});
 // route to ckeck the token
 app.get('/checkToken', withAuth, function(req, res) {
    res.sendStatus(200);
});
//route to update a user's bio
app.put("/bio", withAuth, function (req, res) {
    console.log("bio route whatever")
    db.User.findOneAndUpdate({ email: req.email }, { bio: req.body.bio })
    .then(function (updateBio) {
            db.User.findOne({ email: req.email })
            .then(function (updatedProfile) {
                console.log("bio updated!");
                    res.json(updatedProfile);
                })
                .catch(function (err) {
                    res.json(err);
                });
            })
})

// route to serve uploaded photos
app.get('/photo/:imgId', (req, res) => {
    res.sendFile(__dirname + `/uploads/images/${req.params.imgId}.jpg`);
})

// const upload = multer({dest: '/uploads/temp'});
//route to update a user's photo
app.post("/profileImageUpload", withAuth, upload.single('file'), function (req, res) {
    if (!req.file) {
        console.log("No file received");
        res
            .status(403)
            .contentType("text/plain")
            .end("No file received");
    } else {
        console.log('file received');
        db.User.findOne({
            email: req.email
        })
        .then((foundUser) => {
            const imageFile = fs.readFileSync(req.file.path);
            const encode_image = imageFile.toString('base64');
            const finalImg = {
                contentType: req.file.mimetype,
                image: new Buffer.from(encode_image, 'base64')
            };
            return db.Image.findOneAndUpdate(
                { user: foundUser._id},
                { ...finalImg, user: foundUser._id },
                { new: true, upsert: true })
        })
            .then((createdImage) => {
                return (db.User.findOneAndUpdate(
                    {
                        email: req.email
                    },
                    {
                        photo: 'http://stump-around.herokuapp.com/image/' + createdImage._id
                    },
                    {
                        new: true,
                    })
                    .select('-password -sentRequests -receivedRequests'))
            })
            .then(
                (updatedProfile) => {
                    res
                        .status(200)
                        .json(updatedProfile);
                })
            .catch(function (err) {
                res.json(err);
            });
    }
});
    
//route to add a hike comment
app.post("/comment", function (req, res) {
    db.Comment.create(req.body)
    .then(function (commentData) {
            console.log(commentData);
            db.Hike.findOneAndUpdate({ _id: req.body.hike }, { $push: { comments: commentData._id } }, { new: true })
                .then((result) => console.log(result));
                db.User.findOneAndUpdate({ _id: req.body.user }, { $push: { comments: commentData._id } }, { new: true })
                .then((result) => console.log(result));
                res.json(commentData);
        })
        .catch(function (err) {
            console.log(err);
        })
    })

//route to add a hike comment
app.post("/stumpComment", function (req, res) {
    console.log(req.body);
    db.Comment.create({...req.body, stump: req.body.hike})
    .then(function (commentData) {
            console.log(commentData);
            db.Stump.findOneAndUpdate({ _id: req.body.hike }, { $push: { comments: commentData._id } }, { new: true })
                .then((result) => console.log(result));
                db.User.findOneAndUpdate({ _id: req.body.user }, { $push: { comments: commentData._id } }, { new: true })
                .then((result) => console.log(result));
                res.json(commentData);
        })
        .catch(function (err) {
            console.log(err);
        })
    })

//get call to grab only one hike from database
app.get("/comment/:id", function (req, res) {
    console.log("serverside ID is: ", req.params.id);
    db.Comment.findOne({ _id: req.params.id })
        .populate('user')
        .populate({
            path: "replies",
            populate: {
                path: 'user',
                select: '-password -sentRequests -receivedRequests'
            }
        })
        .then(function (commentRecord) {
            res.json(commentRecord);
        })
        .catch(function (err) {
            res.json(err);
        });
});

//route to add a comment reply
app.post("/reply", function (req, res) {
    db.Comment.create(req.body)
    .then(function (commentData) {
            console.log(commentData);
            db.User.findOneAndUpdate({ _id: req.body.user }, { $push: { comments: commentData._id } }, { new: true })
            .then((result) => db.Comment.findOneAndUpdate({ _id: req.body.repliedTo }, { $push: { replies: commentData._id } }, { new: true }))
            .then((updatedComment) => res.json(updatedComment))
        })
        .catch(function (err) {
            console.log(err);
        })
    })

app.post("/profileComment", function (req, res) {
    db.Comment.create({...req.body, profile: req.body.hike})
    .then(function (commentData) {
            console.log(commentData);
            db.User.findOneAndUpdate({ _id: req.body.hike }, { $push: { profileComments: commentData._id } }, { new: true })
                .then((result) => console.log(result));
                db.User.findOneAndUpdate({ _id: req.body.user }, { $push: { comments: commentData._id } }, { new: true })
                .then((result) => console.log(result));
                res.json(commentData);
        })
        .catch(function (err) {
            console.log(err);
        })
    })

//route to add a hike to favorites
app.post("/favorite", withAuth, function (req, res) {
    db.User.findOneAndUpdate(
        { email: req.email },
        { $addToSet: { hikes: req.body.hikeId } },
        { new: true }
    )
    .select('-password -sentRequests -receivedRequests')
    .then(function (userRecord) {
        res.json(userRecord);
    })
    .catch(function (err) {
        res.json(err);
    });
})
//route to delete a favorite from user
app.delete("/favorite", withAuth, function (req, res) {
    db.User.findOneAndUpdate(
        { email: req.email },
        { $pull: { hikes: req.body.hikeId } },
        { new: true }
        )
        .select('-password -sentRequests -receivedRequests')
        .then(function (userRecord) {
            res.json(userRecord);
        })
    .catch(function (err) {
        res.json(err);
    });
})

//delete a comment
app.delete("/commentdelete", function (req, res) {
    console.log(req.body);
    db.Comment.findOne({
        _id: req.body.id
    })
        .then(function (commentData) {
            console.log(commentData);
            db.User.findOne({
                _id: req.body.user
            })
                .then(function (userData) {
                    if (userData._id.equals(commentData.users)) {
                        db.Comment.deleteOne({ _id: req.body.id })
                            .then(function (commentDelete) {
                                console.log("comment deleted");
                                res.json(commentDelete.hikes);
                            })
                        }
                    else {
                        res.json("You don't have permissions to delete this.")
                    }
                })

            })
        });

app.post("/", function (req, res) {
    res.json('POST');
});
app.post("/login", function (req, res) {
    res.json('POST login');
});
app.post("/signup", function (req, res) {
    res.json('POST signup');
});
// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});

    //post route to add a user to the database
    // app.post("/user/add", function (req, res) {
    //     console.log("post user add", req.body);
    //     let name = req.body.name;
    //     db.User.find({ name: name }, { name: 1 }).limit(1)
    //         .then(function (userRecords) {
    //             console.log(userRecords);
    //             if (userRecords.length) {
    //                 console.log("user exists already; cannot add user");
    //             }
    //             else {
    //                 console.log("new user; adding to database");
    //                 db.User.create({
    //                     name: req.body.name,
    //                     password: req.body.password,
    //                     email: req.body.email
    //                 })
    //             }
    //         })
    // });
