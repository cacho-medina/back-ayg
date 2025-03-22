import { Router } from "express";
import {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
} from "../controllers/posts.controllers.js";
import authTokenJwt from "../middleware/authTokenJwt.js";
import authRole from "../middleware/authRole.js";

const router = Router();

router.post("/new", authTokenJwt, authRole(["admin"]), createPost);
router.get("/all", authTokenJwt, getPosts);
router.get("/:id", authTokenJwt, getPostById);
router.put("/update/:id", authTokenJwt, authRole(["admin"]), updatePost);
router.delete("/delete/:id", authTokenJwt, authRole(["admin"]), deletePost);

export default router;
