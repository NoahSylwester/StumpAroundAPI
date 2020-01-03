const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const saltRounds = 10;
// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
// This is similar to a Sequelize model
const UserSchema = new mongoose.Schema({
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
  profileComments: [{
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }],
  hikes: [{
    type: Schema.Types.ObjectId,
    ref: "Hike"
  }],
  friends: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  sentRequests: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  receivedRequests: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
});

UserSchema.pre('save', function(next) {
  // Check if document is new or a new password has been set
  if (this.isNew || this.isModified('password')) {
    // Saving reference to this because of changing scopes
    const document = this;
    bcrypt.hash(document.password, saltRounds,
      function(err, hashedPassword) {
      if (err) {
        next(err);
      }
      else {
        document.password = hashedPassword;
        next();
      }
    });
  } else {
    next();
  }
});

UserSchema.methods.isCorrectPassword = function(password, callback) {
  bcrypt.compare(password, this.password, function(err, same){
    if (err) {
      callback(err);
    } else {
      callback(err,same);
    }
  });
}
// This creates our model from the above schema, using mongoose's model method
var User = mongoose.model("User", UserSchema);

// Export the User model
module.exports = User;