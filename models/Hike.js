var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
// This is similar to a Sequelize model
var HikeSchema = new Schema({
  // `title` is required and of type String
  apiId: {
    type: Number,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    default: "No location info available"
  },
  summary: {
    type: String,
    required: true,
    default: "No summary available.",
  },
  photo: {
    type: String,
    required: true,
    default: "https://images.unsplash.com/photo-1478954755238-0bb0af1dc326?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=696&q=80",
  },
  length: {
    type: String,
    required: true,
    default: "No length available.",
  },
  // `note` is an object that stores a Note id
  // The ref property links the ObjectId to the Note model
  // This allows us to populate the Article with an associated Note
  comments: [{
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }]
});

// This creates our model from the above schema, using mongoose's model method
var Hike = mongoose.model("Hike", HikeSchema);

// Export the Article model
module.exports = Hike;