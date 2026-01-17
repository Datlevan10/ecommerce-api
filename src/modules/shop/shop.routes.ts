import { Router } from "express";
import shopController from "./shop.controller.js";
import { adminAuth } from "../../middlewares/auth.middleware.js";
import { body } from "express-validator";
import { validateRequest } from "../../middlewares/validation.middleware.js";

const router = Router();

router.get("/", shopController.getActiveShop);
router.use("/admin", adminAuth);
router.get("/admin/all", shopController.getAllShops);
router.get("/admin/stats", shopController.getShopStats);
router.get("/admin/:id", shopController.getShopById);

router.post(
  "/admin",
  [
    body("shopName").notEmpty().withMessage("Shop name is required"),
    body("shopCode")
      .notEmpty()
      .withMessage("Shop code is required")
      .isLength({ min: 3, max: 10 })
      .withMessage("Shop code must be 3-10 characters")
      .matches(/^[A-Z0-9]+$/i)
      .withMessage("Shop code must be alphanumeric"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").notEmpty().withMessage("Phone number is required"),
    body("address.street").notEmpty().withMessage("Street address is required"),
    body("address.city").notEmpty().withMessage("City is required"),
    body("address.country").notEmpty().withMessage("Country is required"),
    body("currencyCode")
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage("Currency code must be 3 characters"),
    body("language")
      .optional()
      .isLength({ min: 2, max: 5 })
      .withMessage("Language code must be 2-5 characters"),
    validateRequest,
  ],
  shopController.createShop
);

router.put(
  "/admin/:id",
  [
    body("shopName")
      .optional()
      .notEmpty()
      .withMessage("Shop name cannot be empty"),
    body("shopCode")
      .optional()
      .isLength({ min: 3, max: 10 })
      .withMessage("Shop code must be 3-10 characters")
      .matches(/^[A-Z0-9]+$/i)
      .withMessage("Shop code must be alphanumeric"),
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("phone")
      .optional()
      .notEmpty()
      .withMessage("Phone number cannot be empty"),
    body("currencyCode")
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage("Currency code must be 3 characters"),
    body("language")
      .optional()
      .isLength({ min: 2, max: 5 })
      .withMessage("Language code must be 2-5 characters"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be boolean"),
    validateRequest,
  ],
  shopController.updateShop
);

router.put("/admin/:id/activate", shopController.activateShop);
router.delete("/admin/:id", shopController.deleteShop);
router.post("/admin/initialize", shopController.initializeShop);

export default router;
