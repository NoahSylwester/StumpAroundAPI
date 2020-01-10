var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
// This is similar to a Sequelize model
var StumpSchema = new Schema({
  // `title` is required and of type String
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    default: "No location info available"
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  altitude: {
    type: Number,
    required: false,
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
  tags: {
    type: Array,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  comments: [{
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }]
});

// This creates our model from the above schema, using mongoose's model method
var Stump = mongoose.model("Stump", StumpSchema);

// Export the Article model
module.exports = Stump;