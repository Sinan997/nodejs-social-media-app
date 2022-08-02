const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator")

const ITEMS_PER_PAGE = 5;


const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");


const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: "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"
    }
}))


// GET MAINPAGE
exports.getHome = (req, res, next) => {

    const page = +req.query.page || 1;
    let totalItems;

    Post.find().countDocuments().then(numProducts => {
        totalItems = numProducts;
        return Post.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)
            .populate("userId")
    }).then((posts) => {
        const likedPosts = [];

        if (posts.length !== 0) {
            if (req.user) {
                var begenilenPostlar = req.user.likedPosts.posts
            } else {
                begenilenPostlar = [];
            }
            for (let post of begenilenPostlar) {
                likedPosts.push(post.postId.toString());
            }
        }
        res.render("user/index", {
            pageTitle: "Main Page",
            path: "/",
            user: req.user,
            likedPosts: likedPosts,
            posts: posts,
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    })
}


// GET LOGIN PAGE
exports.getLogin = (req, res, next) => {
    res.render("user/login", {
        pageTitle: "Login",
        path: "/login",
        user: req.session.user,
        errorMessage: req.flash("fError"),
        oldInput: { email: "", password: "" }
    });
}


// POST LOGIN PAGE
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render("user/login", {
            pageTitle: "Login",
            path: "/login",
            user: req.session.user,
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password }
        });
    }

    User.findOne({ email: email }).then(
        (user) => {
            if (!user) {
                req.flash("fError", "Email is not valid!")
                return res.redirect("/login");
            }

            bcrypt.compare(password, user.password).then(
                (doMatch) => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(() => {
                            res.redirect("/");
                        });
                    }
                    req.flash("fError", "Password is not valid!")
                    res.redirect("/login")
                }
            ).catch(err => {
                res.redirect("/login");
            })

        }
    ).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    })
}

// GET LOGOUT
exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        res.redirect('/');
    });
}


// GET RESET
exports.getReset = (req, res, next) => {
    res.render("user/reset", {
        pageTitle: "Reset Password",
        path: "/reset",
        errorMessage: req.flash("fError"),
    })
}


exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect("/reset")
        }
        const token = buffer.toString("hex");
        User.findOne({ email: req.body.email }).then(
            user => {
                if (!user) {
                    req.flash("fError", "No account with that email found")
                    return res.redirect("/reset");
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            }
        ).then(result => {
            return transporter.sendMail({
                to: req.body.email,
                from: "luyno123@gmail.com",
                subject: "Password Reset",
                html: `
                    <p>You requested a Password Reset</p>
                    <br>
                    <p>Click this <a href='http://localhost:3131/reset/${token}'>link</a> to set a new password</p>
                `
            }).then(() => {
                res.redirect("/")
            })
        })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                next(error);
            })
    })
}

// GET NEWPASSWORd
exports.getNewPassword = (req, res, next) => {
    const token = req.params.token

    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } }).then(user => {
        res.render('user/new-password', {
            path: '/new-password',
            pageTitle: 'New Password',
            errorMessage: req.flash("fError"),
            userId: user._id.toString(),
            passwordToken: token
        });
    })

}

exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const newPassword = req.body.password;
    const passwordToken = req.body.passwordToken;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.flash("fError", errors.array()[0].msg);
        return res.redirect(`/reset/${passwordToken}`)
    }

    let resetUser;

    User.findOne({ resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        }).then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = null;
            resetUser.resetTokenExpiration = null;
            return resetUser.save();
        }).then(
            result => {
                res.redirect("/login");
            }
        ).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error);
        })

}




// GET REGISTER PAGE
exports.getRegister = (req, res, next) => {
    res.render("user/register", {
        pageTitle: "Register",
        path: "/register",
        user: req.session.user,
        errorMessage: req.flash("fError")
    });
}


//POST REGISTER PAGE
exports.postRegister = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const nickname = req.body.nickname;
    const image = req.file;


    const errors = validationResult(req);

    if (!image) {
        return res.status(422).render("user/register", {
            pageTitle: "Register",
            path: "/register",
            user: req.session.user,
            errorMessage: "Attached file is not a image"
        });;
    }

    if (!errors.isEmpty()) {
        return res.status(422).render("user/register", {
            pageTitle: "Register",
            path: "/register",
            user: req.session.user,
            errorMessage: errors.array()[0].msg
        });;
    }

    const imageUrl = image.path;

    bcrypt.hash(password, 12).then(
        hashedPassword => {
            const user = new User({
                email: email,
                nickname: nickname,
                password: hashedPassword,
                imageUrl: imageUrl,
                portfolio: {
                    posts: [],
                },
                likedPosts: {
                    posts: []
                }
            })
            return user.save()
        }
    ).then(
        () => {
            return transporter.sendMail({
                to: email,
                from: "luyno123@gmail.com",
                subject: "Signed up succeeded",
                html: "<h1>You succesfully signed up!</h1>"
            }).then(() => {
                return res.redirect("/login");
            })
        }
    ).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    })
}



// GET USERPROFILE

exports.getUserProfile = (req, res, next) => {
    const userId = req.params.userId;
    if (req.user) {
        var owner = userId == req.user._id;
    } else {
        var owner = false
    }
    User.findById(userId)
        .populate("portfolio.posts.postId")
        .then(user => {
            const posts = user.portfolio.posts;
            const likedPosts = [];

            if (posts.length !== 0) {
                if (req.user) {
                    var begenilenPostlar = req.user.likedPosts.posts
                } else {
                    begenilenPostlar = [];
                }
                for (let post of begenilenPostlar) {
                    likedPosts.push(post.postId.toString());
                }
            }

            res.render("user/user-profile", {
                pageTitle: user.nickname.toUpperCase(),
                path: `/profile/${user._id}`,
                authenticatedUser: req.user,
                user: user,
                posts: posts,
                isOwner: owner,
                likedPosts: likedPosts
            });
        })
}

exports.getUser = (req, res, next) => {
    User.find().select("nickname").then(users => {
        let userInfos = [];
        for (let user of users) {
            userInfos.push({ nickname: user.nickname, id: user._id });
        }
        res.status(200).json({ users: userInfos })
    }).catch(err => console.log(err));
}