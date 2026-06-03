import { Router, type RequestHandler } from "express";
import { upload } from "../../config/multer";
import { validate } from "../../middlewares/validate";
import { authGuard } from "../../middlewares/auth/authGuard";
import { authorize } from "../../middlewares/auth/authorize";
import { PERMISSIONS, type PermissionKey } from "../../constants/permissions";
import { ROLES } from "../../constants/roles";
import { blogCategoryController } from "./category/blog-category.controller";
import { blogController } from "./blog.controller";
import {
  blogCategoryIdSchema,
  blogIdSchema,
  blogLookupSchema,
  createBlogCategorySchema,
  createBlogSchema,
  getBlogsQuerySchema,
  updateBlogCategorySchema,
  updateBlogSchema,
} from "./blog.validation";

const router = Router();

function allowAdminOrPermission(permissionsAny: PermissionKey[]): RequestHandler {
  const permissionGuard = authorize({ permissionsAny });

  return (req, res, next) => {
    if (req.user?.roles.includes(ROLES.ADMIN)) {
      return next();
    }

    return permissionGuard(req, res, next);
  };
}

router.get("/", validate(getBlogsQuerySchema), blogController.getAll);
router.get(
  "/admin",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_READ]),
  validate(getBlogsQuerySchema),
  blogController.getAdminAll
);
router.get(
  "/deleted",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_DELETE]),
  validate(getBlogsQuerySchema),
  blogController.getDeleted
);

router.get("/categories", blogCategoryController.getAll);
router.get(
  "/categories/admin",
  authGuard,
  allowAdminOrPermission([
    PERMISSIONS.BLOG_READ,
    PERMISSIONS.BLOG_CREATE,
    PERMISSIONS.BLOG_UPDATE,
  ]),
  blogCategoryController.getAdminAll
);
router.get(
  "/categories/deleted",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_DELETE]),
  blogCategoryController.getDeleted
);
router.post(
  "/categories",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_CREATE]),
  validate(createBlogCategorySchema),
  blogCategoryController.create
);
router.put(
  "/categories/:id",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_UPDATE]),
  validate(updateBlogCategorySchema),
  blogCategoryController.update
);
router.patch(
  "/categories/:id/restore",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_UPDATE]),
  validate(blogCategoryIdSchema),
  blogCategoryController.restore
);
router.delete(
  "/categories/:id",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_DELETE]),
  validate(blogCategoryIdSchema),
  blogCategoryController.softDelete
);
router.delete(
  "/categories/:id/force",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_DELETE]),
  validate(blogCategoryIdSchema),
  blogCategoryController.forceDelete
);

router.get("/:id", validate(blogLookupSchema), blogController.getById);

router.post(
  "/",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_CREATE]),
  upload.single("image"),
  validate(createBlogSchema),
  blogController.create
);

router.put(
  "/:id",
  authGuard,
  allowAdminOrPermission([
    PERMISSIONS.BLOG_UPDATE,
    PERMISSIONS.BLOG_CHANGE_STATUS,
  ]),
  upload.single("image"),
  validate(updateBlogSchema),
  blogController.update
);

router.patch(
  "/:id/restore",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_UPDATE]),
  validate(blogIdSchema),
  blogController.restore
);

router.delete(
  "/:id",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_DELETE]),
  validate(blogIdSchema),
  blogController.softDelete
);

router.delete(
  "/:id/force",
  authGuard,
  allowAdminOrPermission([PERMISSIONS.BLOG_DELETE]),
  validate(blogIdSchema),
  blogController.forceDelete
);

export default router;
