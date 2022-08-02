const User = require("../models/user");
const Post = require("../models/post");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

// GET ADD-POST 

exports.getAddPost = (req, res, next) => {
    res.render("user/add-post", {
        pageTitle: "Add Post",
        path: "/add-post",
        isAuthenticated: req.session.isLoggedIn,
        user: req.user,
        oldInput: { title: "", imageUrl: "", content: "" },
        errorMessage: req.flash("fError"),
    })
}


// POST ADD-POST

exports.postAddPost = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const content = req.body.content;
    const userId = req.body.userId;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.render("user/add-post", {
            pageTitle: "Add Post",
            path: "/add-post",
            isAuthenticated: req.session.isLoggedIn,
            user: req.user,
            oldInput: { title: title, imageUrl: imageUrl, content: content },
            errorMessage: errors.array()[0].msg
        })
    }

    const imageUrl = image.path;

    const post = new Post({
        // _id: new mongoose.Types.ObjectId("62dac1800d0874c3d5239af8"),
        title: title,
        imageUrl: imageUrl,
        content: content,
        userId: userId,
        likes: 0
    })

    post.save().then(
        (savedPost) => {
            User.findById(userId).then(user => {
                return user.addToPortfolio(savedPost)
            }).then((result) => {
                res.redirect("/");
            }).catch(error => console.log(error))
        }
    ).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    })
}



// POST DELETE POST

exports.deletePost = (req, res, next) => {
    const userId = req.body.userId;
    const postId = req.params.postId;
    if (req.user) {
        var owner = userId == req.user._id;
    } else {
        var owner = false
    }

    User.findById(userId).then(
        (user) => {
            if (userId.toString() != req.user._id.toString()) {
                return res.redirect("/");
            }
            user.removeFromPortfolio(postId).then(
                () => {
                    Post.deleteOne({ _id: postId, userId: user._id }).then(
                        () => {
                            res.status(200).json({ message: "Success" })
                        }
                    )
                }
            ).catch(err => {
                res.status(400).json({ message: "Deleting post failed" })
            })
        }
    ).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    })

}

exports.changeLike = (req, res, next) => {
    const userId = req.body.userId;
    const postId = req.params.postId;
    User.findById(userId).then(
        (user) => {
            const likedPosts = user.likedPosts.posts;
            let found = likedPosts.find(post => post.postId == postId);
            if (!found) {
                Post.findById(postId).then((post) => {
                    post.increasePostLike()
                })
                return user.addToLikedPosts(postId)
            } else {
                Post.findById(postId).then((post) => {
                    post.decreasePostLike()
                })
                return user.removeFromLikedPosts(postId)
            }
        }
    ).then(
        () => {
            return res.redirect("/");
        }
    ).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    })
}