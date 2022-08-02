const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema(
    {
        title: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            required: true
        },
        content: String,
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        likes: {
            type: Number,
            required: true
        }
    });


postSchema.methods.increasePostLike = function () {
    this.likes++;
    return this.save();
}

postSchema.methods.decreasePostLike = function () {
    this.likes--;
    return this.save();
}

module.exports = mongoose.model("Post", postSchema);