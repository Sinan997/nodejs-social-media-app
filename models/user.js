const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true
        },
        nickname: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            required: true
        },
        resetToken: String,
        resetTokenExpiration: Date,
        portfolio: {
            posts: [
                {
                    postId: {
                        type: Schema.Types.ObjectId,
                        ref: 'Post',
                        required: true
                    }
                }
            ]
        },
        likedPosts: {
            posts: [
                {
                    postId: {
                        type: Schema.Types.ObjectId,
                        ref: 'Post',
                        required: true
                    }
                }
            ]
        }
    }
);

userSchema.methods.addToPortfolio = function (post) {
    const updatedPortfolioPosts = [...this.portfolio.posts];
    updatedPortfolioPosts.push({ postId: post._id })
    const updatedPortfolio = { posts: updatedPortfolioPosts }
    this.portfolio = updatedPortfolio;
    return this.save();
}

userSchema.methods.removeFromPortfolio = function (postId) {
    const updatedPortfolioPosts = this.portfolio.posts.filter(post => {
        return post.postId.toString() !== postId.toString();
    });
    this.portfolio.posts = updatedPortfolioPosts;
    return this.save();
}

userSchema.methods.addToLikedPosts = function (postId) {
    const updatedLikedPostsPosts = [...this.likedPosts.posts];
    updatedLikedPostsPosts.push({ postId: postId });
    const updatedPortfolio = { posts: updatedLikedPostsPosts }
    this.likedPosts = updatedPortfolio;
    return this.save();
}

userSchema.methods.removeFromLikedPosts = function (postId) {
    const updatedLikedPostsPosts = this.likedPosts.posts.filter(post => {
        return post.postId.toString() !== postId.toString();
    });
    this.likedPosts.posts = updatedLikedPostsPosts;
    return this.save();
}




module.exports = mongoose.model("User", userSchema);