import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: passwordSchema,
  studentType: z.enum(["ESSENCIAL", "PRO", "PREMIUM"]),
  modalities: z.string().optional(),
  photoUrl: z.string().optional().nullable(),
  isKids: z.boolean().optional(),
});

export const slotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isAvailable: z.boolean().optional(),
  userId: z.string().min(1).optional().nullable(),
});

export const groupClassSchema = z.object({
  name: z.string().min(2),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  capacity: z.number().min(1),
  isKids: z.boolean().optional(),
  classType: z.enum(["GROUP", "SEMI_PRIVATE"]).optional(),
});

export const bookingSchema = z.object({
  type: z.enum(["PRIVATE", "GROUP"]),
  privateSlotId: z.string().optional(),
  groupClassId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userId: z.string().optional(),
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

const ALL_BELTS = [
  "BRANCA", "AZUL", "ROXA", "MARROM", "PRETA",
  "CINZA_BRANCA", "CINZA", "CINZA_PRETA",
  "AMARELA_BRANCA", "AMARELA", "AMARELA_PRETA",
  "LARANJA_BRANCA", "LARANJA", "LARANJA_PRETA",
  "VERDE_BRANCA", "VERDE", "VERDE_PRETA",
] as const;

export const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  studentType: z.enum(["ESSENCIAL", "PRO", "PREMIUM"]).optional(),
  belt: z.enum(ALL_BELTS).optional(),
  degrees: z.number().min(0).max(4).optional(),
  modalities: z.string().optional(),
  isKids: z.boolean().optional(),
  initialCheckins: z.number().min(0).optional(),
  monthlyCredits: z.number().min(0).optional(),
  photoUrl: z.string().optional().nullable(),
  monthlyDueDay: z.number().min(1).max(31).optional().nullable(),
  lastPaymentDate: z.string().optional().nullable(),
  lastGraduationDate: z.string().optional().nullable(),
  lastBeltChangeDate: z.string().optional().nullable(),
  resetBeltProgress: z.boolean().optional(),
  resetDegreeProgress: z.boolean().optional(),
});
