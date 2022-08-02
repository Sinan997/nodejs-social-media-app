const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/is-auth");
const { check } = require("express-validator");

const postController = require("../controllers/post");


// GET ADDPOST
router.get("/add-post", isAuth, postController.getAddPost);


// POST ADDPOST
router.post("/add-post", [
    check("title").isLength({ min: 3 }).withMessage("Title cannot be shorter than 5 characters."),
], isAuth, postController.postAddPost);

// POST DELETE POST

router.delete("/post/:postId", isAuth, postController.deletePost);


// INCREASE LIKE 

router.post("/change-like/:postId", isAuth, postController.changeLike);

module.exports = router;