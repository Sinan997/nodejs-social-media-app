const express = require("express");
const router = express.Router();
const { check, body } = require("express-validator");
const User = require("../models/user");

const userController = require("../controllers/user");

router.get("/", userController.getHome);

router.get("/login", userController.getLogin);

router.post("/login", [
    check("email", "Please enter a valid email").isEmail().trim().withMessage(),
    check("password", "Password must be a minimum of 5 characters").trim().isLength({ min: 5 })
], userController.postLogin);

router.post("/logout", userController.postLogout);

router.get("/reset", userController.getReset);

router.post("/reset", userController.postReset);

router.get("/reset/:token", userController.getNewPassword);

router.post("/new-password", [
    check("password", "Password must be a minimum of 5 characters").trim().isLength({ min: 5 })
], userController.postNewPassword);

router.get("/register", userController.getRegister);

router.post("/register",
    [
        check("email")
            .isEmail()
            .withMessage("Please enter a valid email")
            .custom((value, { req }) => {
                return User.findOne({ email: value }).then(
                    user => {
                        if (user) {
                            return Promise.reject("This email is already registered")
                        }
                    }
                )
            }),

        check("password", "Please enter a valid password with only numbers and text at least 5 characters")
            .isLength({ min: 5, max: 24 })
            .isAlphanumeric()
    ],
    userController.postRegister);

router.get("/profile/:userId", userController.getUserProfile);

router.get("/getUsers", userController.getUser)


module.exports = router;