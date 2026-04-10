import { Router } from "express";
import { userRouter } from "../modules/user/user.route";
import { authRouter } from "../modules/auth/auth.route";
import { authGuard } from "../middlewares/auth/authGuard";
import { requireRole } from "../middlewares/requireRole";
import { ROLES } from "../constants/roles";
import categoryRouter from "../modules/category/category.route";
import productRouter from "../modules/course/course.route";
import { rbacRouter } from "../modules/rbac/rbac.routes";
import { teacherRouter } from "../modules/teacher/teacher.routes";
import { studentRouter } from "../modules/student/student.route";
import { classRoomRouter } from "../modules/classroom/classroom.route";
import cartRouter from "../modules/cart/cart.route";
import paymentRoutes from "../modules/payment/payment.routes";
import paymentAuditRouter from "../modules/audit/payment/payment-audit.route";
import securityAuditRouter from "../modules/audit/security/security-audit.route";
import dashboardRouter from "../modules/dashboard/dashboard.route";
import accountRouter  from "../modules/account/account.route";

export const router = Router();

router.use("/auth", authRouter);

// account
router.use("/account", authGuard, accountRouter);

// admin-only
router.use("/users", authGuard, requireRole(ROLES.ADMIN), userRouter);

// public
router.get("/health", (_req, res) => res.json({ ok: true }));
router.use("/categories", categoryRouter);
router.use("/products", productRouter);
router.use("/rbac", rbacRouter);
router.use("/teachers", teacherRouter);
router.use("/students", studentRouter);
router.use("/classes", classRoomRouter);
router.use("/cart", cartRouter);

// dashboard
router.use("/dashboard", dashboardRouter);

// audit phải đứng trước /payments
router.use("/payments/audits", paymentAuditRouter);

// payment chính chỉ mount 1 lần
router.use("/payments", paymentRoutes);

// security audit
router.use("/security-audits", securityAuditRouter);