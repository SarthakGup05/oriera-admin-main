//create all the routes for auth
import express from "express";
import { authMiddleware } from "../middleware/authmiddleware.js";
import { check, login, logout, register, } from "../controllers/auth.controllers.js";

const authRoutes = express.Router();

authRoutes.post("/register", register);

authRoutes.post("/login", login);

authRoutes.post ("/logout", authMiddleware, logout)

authRoutes.get("/profile", authMiddleware, check)

export default authRoutes;

