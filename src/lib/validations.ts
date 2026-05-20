import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  studentType: z.enum(["PARTICULAR", "COLETIVA"]),
  modalities: z.string().optional(),
  photoUrl: z.string().optional().nullable(),
});

export const slotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isAvailable: z.boolean().optional(),
  userId: z.string().min(1).optional().nullable(),
});

export const groupClassSchema = z.object({
  name: z.string().min(2),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  capacity: z.number().min(1),
});

export const bookingSchema = z.object({
  type: z.enum(["PRIVATE", "GROUP"]),
  privateSlotId: z.string().optional(),
  groupClassId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const eventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const notificationSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
});

export const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  studentType: z.enum(["PARTICULAR", "COLETIVA"]).optional(),
  belt: z.enum(["BRANCA", "AZUL", "ROXA", "MARROM", "PRETA"]).optional(),
  degrees: z.number().min(0).max(4).optional(),
  modalities: z.string().optional(),
  initialCheckins: z.number().min(0).optional(),
  photoUrl: z.string().optional().nullable(),
  monthlyDueDay: z.number().min(1).max(31).optional().nullable(),
  lastPaymentDate: z.string().optional().nullable(),
  lastGraduationDate: z.string().optional().nullable(),
});
