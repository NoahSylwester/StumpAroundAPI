var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new NoteSchema object
// This is similar to a Sequelize model
var CommentSchema = new Schema({
  // `body` is of type String
  content: String,
  date_created: {
    type: Date,
    required: true,
    default: Date.now,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  hike: {
    type: Schema.Types.ObjectId,
    ref: "Hike"
  }
});

// This creates our model from the above schema, using mongoose's model method
var Comment = mongoose.model("Comment", CommentSchema);

// Export the Note model
module.exports = Comment;