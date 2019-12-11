var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
// This is similar to a Sequelize model
var UserSchema = new Schema({
  // `title` is required and of type String
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  // `link` is required and of type String
  date_created: {
    type: Date,
    required: true,
    default: Date.now,
  },
  photo: {
    type: String,
    required: true,
    default: "https://images.unsplash.com/photo-1492133969098-09ba49699f47?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1789&q=80",
  },
  bio: {
    type: String,
    required: true,
    default: "No bio information yet.",
  },
  // `note` is an object that stores a Note id
  // The ref property links the ObjectId to the Note model
  // This allows us to populate the User with an associated Note
  comments: [{
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }],
  hikes: [{
    type: Schema.Types.ObjectId,
    ref: "Hike"
  }],
});

// This creates our model from the above schema, using mongoose's model method
var User = mongoose.model("User", UserSchema);

// Export the User model
module.exports = User;