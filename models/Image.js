var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new NoteSchema object
// This is similar to a Sequelize model
var ImageSchema = new Schema({
  // `body` is of type String
  date_created: {
    type: Date,
    required: true,
    default: Date.now,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  stump: {
    type: Schema.Types.ObjectId,
    ref: "Stump"
  },
  contentType: {
      type: String,
      image: Buffer,
  }
});