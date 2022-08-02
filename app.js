const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const User = require("./models/user");
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const crypto = require("crypto");


const MONGODB_URI = "mongodb://0.0.0.0:27017/lunyoBlog";


const store = new MongoDBStore(
    {
        uri: MONGODB_URI,
        collection: "sessions"
    }
);

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg" || file.mimetype === "image/png") {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        crypto.randomBytes(60, (err, buffer) => {
            if (err) {
                console.log(err);
                return true
            }
            cb(null, buffer.toString("hex") + file.originalname)

        })
    }
})

const csrfProtection = csrf();

const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const errorController = require("./controllers/error");

app.set("view engine", "ejs");


app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PATCH,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    next();
})


app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single("image"))
app.use("/images", express.static(path.join(__dirname, 'images')))
app.use(session(
    { secret: "s3CR3t", resave: false, saveUninitialized: false, store: store })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})


app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err))
        });
});



app.use(userRoutes);
app.use(postRoutes);

app.get("/500", errorController.get500);


app.use(errorController.get404);

app.use((error, req, res, next) => {
    // res.redirect("/500");
    res.status(500).render("500", {
        pageTitle: "Page Not Found",
        path: "/500",
    })
})



mongoose.connect(MONGODB_URI)
    .then(result => {
        console.log("Database connected successfully");
        app.listen(3131);
    }).catch(err => console.log(err));