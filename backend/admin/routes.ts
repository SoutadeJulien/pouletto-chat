import { Router, Request, Response } from "express";
import adminController from "./controller.js";

const adminRouter = Router();

adminRouter.get("/", (req: Request, res: Response) => {
  adminController.getPage(req, res);
});

adminRouter.get("/users", (req: Request, res: Response) => {
  adminController.getUsers(req, res);
});

adminRouter.post("/users", (req: Request, res: Response) => {
  adminController.createUser(req, res);
});

adminRouter.delete("/users/:id", (req: Request, res: Response) => {
  adminController.deleteUser(req, res);
});

export default adminRouter;
