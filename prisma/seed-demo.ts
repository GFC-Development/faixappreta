import { PrismaClient } from "../src/generated/prisma/client";
import { hashSync } from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

const TENANT_URL = process.env.TENANT_TURSO_URL!;
const TENANT_TOKEN = process.env.TENANT_TURSO_TOKEN!;

function createClient(): PrismaClient {
  const { PrismaLibSql } = require("@prisma/adapter-libsql");
  return new PrismaClient({
    adapter: new PrismaLibSql({
      url: TENANT_URL,
      authToken: TENANT_TOKEN,
    }),
  });
}

const PASSWORD_HASH = hashSync("123456", 10);

const STUDENTS = [
  { name: "Lucas Silva", email: "lucas.silva@email.com", belt: "AZUL", degrees: 2, studentType: "PRO", initialCheckins: 85, modalities: "GRAPPLING" },
  { name: "Pedro Oliveira", email: "pedro.oliveira@email.com", belt: "ROXA", degrees: 1, studentType: "PREMIUM", initialCheckins: 210, modalities: "GRAPPLING,MMA" },
  { name: "Marcos Santos", email: "marcos.santos@email.com", belt: "BRANCA", degrees: 3, studentType: "ESSENCIAL", initialCheckins: 42, modalities: "GRAPPLING" },
  { name: "Rafael Costa", email: "rafael.costa@email.com", belt: "AZUL", degrees: 0, studentType: "PRO", initialCheckins: 65, modalities: "GRAPPLING" },
  { name: "Bruno Ferreira", email: "bruno.ferreira@email.com", belt: "MARROM", degrees: 1, studentType: "PREMIUM", initialCheckins: 380, modalities: "GRAPPLING,MMA" },
  { name: "Thiago Souza", email: "thiago.souza@email.com", belt: "BRANCA", degrees: 1, studentType: "ESSENCIAL", initialCheckins: 18, modalities: "GRAPPLING" },
  { name: "Gabriel Almeida", email: "gabriel.almeida@email.com", belt: "AZUL", degrees: 3, studentType: "PRO", initialCheckins: 120, modalities: "GRAPPLING" },
  { name: "Anderson Lima", email: "anderson.lima@email.com", belt: "ROXA", degrees: 0, studentType: "PREMIUM", initialCheckins: 195, modalities: "GRAPPLING,MMA" },
  { name: "Felipe Ribeiro", email: "felipe.ribeiro@email.com", belt: "BRANCA", degrees: 2, studentType: "ESSENCIAL", initialCheckins: 30, modalities: "MMA" },
  { name: "Diego Martins", email: "diego.martins@email.com", belt: "AZUL", degrees: 1, studentType: "PRO", initialCheckins: 92, modalities: "GRAPPLING" },
  { name: "Caio Nascimento", email: "caio.nascimento@email.com", belt: "BRANCA", degrees: 0, studentType: "ESSENCIAL", initialCheckins: 8, modalities: "GRAPPLING" },
  { name: "Henrique Pereira", email: "henrique.pereira@email.com", belt: "ROXA", degrees: 2, studentType: "PREMIUM", initialCheckins: 240, modalities: "GRAPPLING" },
  { name: "Matheus Gomes", email: "matheus.gomes@email.com", belt: "AZUL", degrees: 0, studentType: "PRO", initialCheckins: 70, modalities: "GRAPPLING,MMA" },
  { name: "Leonardo Barbosa", email: "leonardo.barbosa@email.com", belt: "BRANCA", degrees: 4, studentType: "ESSENCIAL", initialCheckins: 55, modalities: "GRAPPLING" },
  { name: "Victor Hugo Dias", email: "victor.dias@email.com", belt: "MARROM", degrees: 0, studentType: "PREMIUM", initialCheckins: 350, modalities: "GRAPPLING" },
  { name: "Arthur Cardoso", email: "arthur.cardoso@email.com", belt: "BRANCA", degrees: 0, studentType: "ESSENCIAL", initialCheckins: 3, modalities: "GRAPPLING" },
  { name: "Julio Cesar Ramos", email: "julio.ramos@email.com", belt: "AZUL", degrees: 1, studentType: "PRO", initialCheckins: 88, modalities: "GRAPPLING" },
  { name: "Rodrigo Mendes", email: "rodrigo.mendes@email.com", belt: "PRETA", degrees: 0, studentType: "PREMIUM", initialCheckins: 520, modalities: "GRAPPLING,MMA" },
  // Kids
  { name: "Miguel Silva", email: "miguel.silva@email.com", belt: "BRANCA", degrees: 0, studentType: "ESSENCIAL", initialCheckins: 15, modalities: "GRAPPLING", isKids: true },
  { name: "Davi Oliveira", email: "davi.oliveira@email.com", belt: "BRANCA", degrees: 1, studentType: "ESSENCIAL", initialCheckins: 25, modalities: "GRAPPLING", isKids: true },
  { name: "Enzo Costa", email: "enzo.costa@email.com", belt: "BRANCA", degrees: 2, studentType: "ESSENCIAL", initialCheckins: 38, modalities: "GRAPPLING", isKids: true },
  // Pending
  { name: "Joao Paulo Neto", email: "joao.neto@email.com", belt: "BRANCA", degrees: 0, studentType: "ESSENCIAL", initialCheckins: 0, modalities: "GRAPPLING", status: "PENDING" },
  { name: "Renan Lopes", email: "renan.lopes@email.com", belt: "BRANCA", degrees: 0, studentType: "ESSENCIAL", initialCheckins: 0, modalities: "MMA", status: "PENDING" },
];

const GROUP_CLASSES = [
  { name: "Grappling Fundamentos", dayOfWeek: 1, startTime: "07:00", endTime: "08:00", capacity: 25, classType: "GROUP" },
  { name: "Grappling Fundamentos", dayOfWeek: 3, startTime: "07:00", endTime: "08:00", capacity: 25, classType: "GROUP" },
  { name: "Grappling Fundamentos", dayOfWeek: 5, startTime: "07:00", endTime: "08:00", capacity: 25, classType: "GROUP" },
  { name: "Grappling Avancado", dayOfWeek: 1, startTime: "19:00", endTime: "20:30", capacity: 20, classType: "GROUP" },
  { name: "Grappling Avancado", dayOfWeek: 3, startTime: "19:00", endTime: "20:30", capacity: 20, classType: "GROUP" },
  { name: "Grappling Avancado", dayOfWeek: 5, startTime: "19:00", endTime: "20:30", capacity: 20, classType: "GROUP" },
  { name: "MMA", dayOfWeek: 2, startTime: "19:00", endTime: "20:30", capacity: 15, classType: "GROUP" },
  { name: "MMA", dayOfWeek: 4, startTime: "19:00", endTime: "20:30", capacity: 15, classType: "GROUP" },
  { name: "No-Gi", dayOfWeek: 6, startTime: "10:00", endTime: "11:30", capacity: 20, classType: "GROUP" },
  { name: "Kids Jiu-Jitsu", dayOfWeek: 2, startTime: "17:00", endTime: "18:00", capacity: 15, classType: "GROUP", isKids: true },
  { name: "Kids Jiu-Jitsu", dayOfWeek: 4, startTime: "17:00", endTime: "18:00", capacity: 15, classType: "GROUP", isKids: true },
  { name: "Open Mat", dayOfWeek: 6, startTime: "09:00", endTime: "10:00", capacity: 30, classType: "GROUP" },
];

const BELT_REQUIREMENTS = [
  { belt: "AZUL", requiredClasses: 80 },
  { belt: "ROXA", requiredClasses: 200 },
  { belt: "MARROM", requiredClasses: 350 },
  { belt: "PRETA", requiredClasses: 500 },
];

function getRecentDates(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= count * 2; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0) continue; // skip sunday
    dates.push(d.toISOString().split("T")[0]);
    if (dates.length >= count) break;
  }
  return dates;
}

async function main() {
  const prisma = createClient();

  console.log("Creating students...");
  const studentIds: string[] = [];
  for (const s of STUDENTS) {
    const id = createId();
    await prisma.user.create({
      data: {
        id,
        name: s.name,
        email: s.email,
        passwordHash: PASSWORD_HASH,
        role: "STUDENT",
        status: (s as any).status || "APPROVED",
        studentType: s.studentType,
        belt: s.belt,
        degrees: s.degrees,
        initialCheckins: s.initialCheckins,
        monthlyCredits: s.studentType === "ESSENCIAL" ? 8 : s.studentType === "PRO" ? 12 : 20,
        modalities: s.modalities,
        isKids: (s as any).isKids || false,
        monthlyDueDay: Math.floor(Math.random() * 28) + 1,
      },
    });
    if ((s as any).status !== "PENDING") {
      studentIds.push(id);
    }
  }
  console.log(`  ${STUDENTS.length} students created`);

  // Get admin ID for instructor
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const instructorId = admin?.id || null;

  console.log("Creating group classes...");
  const classIds: string[] = [];
  for (const gc of GROUP_CLASSES) {
    const id = createId();
    await prisma.groupClass.create({
      data: {
        id,
        name: gc.name,
        dayOfWeek: gc.dayOfWeek,
        startTime: gc.startTime,
        endTime: gc.endTime,
        capacity: gc.capacity,
        classType: gc.classType,
        isKids: (gc as any).isKids || false,
        instructorId,
      },
    });
    classIds.push(id);
  }
  console.log(`  ${GROUP_CLASSES.length} group classes created`);

  console.log("Creating bookings and attendance...");
  const dates = getRecentDates(14);
  let bookingCount = 0;

  for (const date of dates) {
    const d = new Date(date);
    const dow = d.getDay();

    // Find classes for this day of week
    const dayClasses = GROUP_CLASSES.map((gc, idx) => ({ ...gc, id: classIds[idx] }))
      .filter((gc) => gc.dayOfWeek === dow);

    for (const gc of dayClasses) {
      // Random subset of students for this class
      const eligible = studentIds.filter((_, i) => {
        const student = STUDENTS[i];
        if ((gc as any).isKids) return (student as any).isKids;
        if (!(student as any).isKids && student.modalities.includes(gc.name === "MMA" ? "MMA" : "GRAPPLING")) return true;
        return false;
      });

      const attending = eligible
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(eligible.length * 0.6) + Math.floor(Math.random() * 4));

      for (const userId of attending) {
        const checkedIn = Math.random() > 0.1;
        const checkinStatus = checkedIn
          ? Math.random() > 0.05 ? "PRESENTE" : "AUSENTE"
          : null;

        await prisma.booking.create({
          data: {
            id: createId(),
            userId,
            type: "GROUP",
            groupClassId: gc.id,
            date,
            status: "CONFIRMED",
            checkedIn,
            checkinStatus,
          },
        });
        bookingCount++;
      }
    }
  }
  console.log(`  ${bookingCount} bookings created`);

  console.log("Creating belt requirements...");
  for (const br of BELT_REQUIREMENTS) {
    const existing = await prisma.beltRequirement.findUnique({ where: { belt: br.belt } });
    if (!existing) {
      await prisma.beltRequirement.create({
        data: { id: createId(), belt: br.belt, requiredClasses: br.requiredClasses },
      });
    }
  }

  console.log("Creating events...");
  if (instructorId) {
    await prisma.event.create({
      data: {
        id: createId(),
        title: "Seminario de Guarda com Professor Visitante",
        description: "Seminario especial sobre passagem e retencao de guarda. Aberto a todos os alunos.",
        date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        createdById: instructorId,
      },
    });
    await prisma.event.create({
      data: {
        id: createId(),
        title: "Graduacao - Julho 2026",
        description: "Cerimonia de graduacao de faixas. Presenca obrigatoria para graduandos.",
        date: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0],
        createdById: instructorId,
      },
    });
    await prisma.event.create({
      data: {
        id: createId(),
        title: "Copa Teste Gracie de Jiu-Jitsu",
        description: "Competicao interna do CT. Inscricoes abertas para todas as faixas.",
        date: new Date(Date.now() + 35 * 86400000).toISOString().split("T")[0],
        createdById: instructorId,
      },
    });

    console.log("Creating notifications...");
    await prisma.notification.create({
      data: {
        id: createId(),
        title: "Horario especial nesta semana",
        message: "Nesta sexta-feira o treino das 19h sera substituido pelo Open Mat. Aproveitem para treinar livre!",
        createdById: instructorId,
      },
    });
    await prisma.notification.create({
      data: {
        id: createId(),
        title: "Parabens aos graduados!",
        message: "Parabens a todos que receberam novas faixas e graus na ultima graduacao. Continuem treinando forte!",
        createdById: instructorId,
      },
    });
  }

  console.log("Creating graduation logs...");
  // Some graduation history for advanced students
  const advancedStudents = STUDENTS.filter(s => s.belt !== "BRANCA" && (s as any).status !== "PENDING");
  for (const s of advancedStudents) {
    const user = await prisma.user.findUnique({ where: { email: s.email } });
    if (!user) continue;
    await prisma.graduationLog.create({
      data: {
        id: createId(),
        userId: user.id,
        belt: s.belt,
        degrees: s.degrees,
        type: "BELT",
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 86400000),
      },
    });
  }

  await prisma.$disconnect();
  console.log("\nDone! Demo data created successfully.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
