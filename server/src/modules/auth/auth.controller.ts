import { Request, Response } from "express";
import prisma from "../../lib/prisma";
import {
  generateTokens,
  verifyRefreshToken,
  revokeRefreshToken,
  hashPassword,
  comparePassword,
} from "./auth.service";
import { loginSchema, refreshSchema } from "./auth.schema";

// Student Login
export const studentLogin = async (req: Request, res: Response) => {
  try {
    const { rollNumber, password } = loginSchema.parse(req.body);
    const student = await prisma.student.findUnique({ where: { rollNumber } });

    if (!student || !(await comparePassword(password, student.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const tokens = await generateTokens({
      id: student.id,
      role: "student",
      name: student.name,
      email: student.email,
      mustChangePassword: student.mustChangePassword,
      onboardingDone: student.onboardingDone,
    });

    res.json({
      ...tokens,
      mustChangePassword: student.mustChangePassword,
      onboardingDone: student.onboardingDone,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Admin / Teacher Login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin || !(await comparePassword(password, admin.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const tokens = await generateTokens({
      id: admin.id,
      role: admin.role,
      name: admin.name,
      email: admin.email,
    });
    res.json(tokens);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Teacher Login
export const teacherLogin = async (req: Request, res: Response) => {
  try {
    const { employeeId, password } = req.body;
    if (!employeeId || !password)
      return res
        .status(400)
        .json({ message: "employeeId and password required" });

    const teacher = await prisma.teacher.findUnique({ where: { employeeId } });
    if (!teacher || !(await comparePassword(password, teacher.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const tokens = await generateTokens({
      id: teacher.id,
      role: "teacher",
      name: teacher.name,
      email: teacher.email,
      mustChangePassword: teacher.mustChangePassword,
    });

    res.json({ ...tokens, mustChangePassword: teacher.mustChangePassword });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Complete Onboarding (first-login: set password + gender)
export const completeOnboarding = async (req: Request, res: Response) => {
  try {
    const { newPassword, gender } = req.body;
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }
    if (!["male", "female"].includes(gender)) {
      return res.status(400).json({ message: "Gender must be male or female" });
    }

    const hash = await hashPassword(newPassword);

    await prisma.student.update({
      where: { id: userId },
      data: {
        passwordHash: hash,
        gender,
        mustChangePassword: false,
        onboardingDone: true,
      },
    });

    // Issue a fresh token with updated flags
    const student = await prisma.student.findUnique({ where: { id: userId } });
    const tokens = await generateTokens({
      id: userId,
      role,
      name: student!.name,
      email: student!.email,
      mustChangePassword: false,
      onboardingDone: true,
    });

    res.json({ ...tokens, message: "Onboarding complete" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Change Password (authenticated students & teachers)
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    if (!oldPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Invalid password fields" });
    }

    if (role === "student") {
      const student = await prisma.student.findUnique({
        where: { id: userId },
      });
      if (
        !student ||
        !(await comparePassword(oldPassword, student.passwordHash))
      ) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }
      await prisma.student.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(newPassword) },
      });
    } else if (role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: userId },
      });
      if (
        !teacher ||
        !(await comparePassword(oldPassword, teacher.passwordHash))
      ) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }
      await prisma.teacher.update({
        where: { id: userId },
        data: {
          passwordHash: await hashPassword(newPassword),
          mustChangePassword: false,
        },
      });
    } else {
      const admin = await prisma.admin.findUnique({ where: { id: userId } });
      if (!admin || !(await comparePassword(oldPassword, admin.passwordHash))) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }
      await prisma.admin.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(newPassword) },
      });
    }

    res.json({ message: "Password changed successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Admin: Force-reset a student or teacher password
export const adminResetPassword = async (req: Request, res: Response) => {
  try {
    const { targetId, targetType, newPassword } = req.body; // targetType: 'student' | 'teacher'
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ message: "Password too short" });

    const hash = await hashPassword(newPassword);
    if (targetType === "student") {
      await prisma.student.update({
        where: { id: targetId },
        data: { passwordHash: hash, mustChangePassword: true },
      });
    } else if (targetType === "teacher") {
      await prisma.teacher.update({
        where: { id: targetId },
        data: { passwordHash: hash, mustChangePassword: true },
      });
    } else {
      return res.status(400).json({ message: "Invalid targetType" });
    }

    res.json({ message: "Password reset. User must change it on next login." });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Refresh Token
export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const decoded = await verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    await revokeRefreshToken(refreshToken);
    const tokens = await generateTokens({
      id: decoded.userId,
      role: decoded.role,
    });
    res.json(tokens);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    await revokeRefreshToken(refreshToken);
    res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
