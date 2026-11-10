import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { z } from "zod";
import multer from "multer";
import { load } from "cheerio";
import mammoth from "mammoth";
import { prisma } from "../db.js";
import { allow, safeUser, sendData } from "../middleware.js";
const router = Router();
const wordUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // Maksimum 20 MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".docx")) {
      return cb(new Error("Faqat .docx formatidagi Word fayl qabul qilinadi."));
    }

    cb(null, true);
  },
});
type WordOptionId = "A" | "B" | "C" | "D";

type ParsedWordQuestion = {
  id: string;
  questionNumber: number;
  text: string;
  imageUrl?: string;
  options: {
    id: WordOptionId;
    text: string;
  }[];
  correctOptionId?: WordOptionId;
  points: number;
  explanation?: string;
};

const parseWordQuestions = (html: string) => {
  const normalizedHtml = html.replace(/<br\s*\/?>/gi, "</p><p>");

  const $ = load(normalizedHtml);

  const blocks = $("body").find("p, li").toArray();

  const questions: ParsedWordQuestion[] = [];
  const errors: string[] = [];

  let current: {
    questionNumber: number;
    text: string;
    imageUrl?: string;
    options: { id: WordOptionId; text: string }[];
    correctOptionId?: WordOptionId;
    points: number;
    explanation?: string;
  } | null = null;

  let pendingImage: string | undefined;

  const finishQuestion = () => {
    if (!current) return;

    const errorCountBefore = errors.length;
    const label = `Savol ${current.questionNumber}`;

    const optionIds = new Set(current.options.map((option) => option.id));

    const missingOptions = (["A", "B", "C", "D"] as const).filter(
      (id) => !optionIds.has(id),
    );

    if (!current.text.trim()) {
      errors.push(`${label}: savol matni mavjud emas.`);
    }

    if (missingOptions.length > 0) {
      errors.push(
        `${label}: ${missingOptions.join(", ")} variantlari yetishmaydi.`,
      );
    }

    if (current.correctOptionId && !optionIds.has(current.correctOptionId)) {
      errors.push(`${label}: belgilangan javob varianti mavjud emas.`);
    }

    if (errors.length === errorCountBefore) {
      questions.push({
        id: `word-${Date.now()}-${questions.length + 1}`,
        questionNumber: current.questionNumber,
        text: current.text,
        imageUrl: current.imageUrl,
        options: current.options,
        correctOptionId: current.correctOptionId,
        points: current.points,
        explanation: current.explanation,
      });
    }

    current = null;
  };

  for (const element of blocks) {
    const block = $(element);

    const imageSrc = block.find("img").first().attr("src");

    let validImage: string | undefined;

    if (imageSrc) {
      if (/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(imageSrc)) {
        validImage = imageSrc;
      } else {
        errors.push(
          "Rasm formati qo'llab-quvvatlanmaydi. PNG, JPG, GIF yoki WEBP ishlating.",
        );
      }
    }

    const content = block.clone();
    content.find("img").remove();

    const text = content
      .text()
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) {
      if (validImage) {
        if (current && !current.imageUrl) {
          current.imageUrl = validImage;
        } else if (!current) {
          pendingImage = validImage;
        }
      }
      continue;
    }

    const questionMatch = text.match(
      /^(?:savol\s*)?(\d{1,3})(?:\s*[-–]\s*savol)?(?:\s*\([^)]*\))?\s*[.):\-]\s*(.*)$/i,
    );

    if (questionMatch) {
      finishQuestion();

      current = {
        questionNumber: Number(questionMatch[1]),
        text: questionMatch[2].trim(),
        imageUrl: validImage ?? pendingImage,
        options: [],
        points: 3,
      };

      pendingImage = undefined;
      continue;
    }

    if (!current) continue;

    if (validImage && !current.imageUrl) {
      current.imageUrl = validImage;
    }

    const optionMatch = text.match(/^\s*([A-D])\s*[).:\-]\s*(.+)$/i);

    if (optionMatch) {
      const optionId = optionMatch[1].toUpperCase() as WordOptionId;

      if (current.options.some((o) => o.id === optionId)) {
        errors.push(
          `Savol ${current.questionNumber}: ${optionId} varianti takrorlangan.`,
        );
      } else {
        current.options.push({
          id: optionId,
          text: optionMatch[2].trim(),
        });
      }

      continue;
    }

    const answerMatch = text.match(
      /^(?:javob|correct answer)\s*[:\-]\s*([A-D])$/i,
    );

    if (answerMatch) {
      current.correctOptionId = answerMatch[1].toUpperCase() as WordOptionId;
      continue;
    }

    const pointsMatch = text.match(
      /^(?:ball|points)\s*[:\-]\s*(\d+(?:[.,]\d+)?)$/i,
    );

    if (pointsMatch) {
      current.points = Number(pointsMatch[1].replace(",", "."));
      continue;
    }

    const explanationMatch = text.match(
      /^(?:izoh|tushuntirish|explanation)\s*[:\-]\s*(.*)$/i,
    );

    if (explanationMatch) {
      current.explanation = explanationMatch[1].trim();
      continue;
    }

    if (current.options.length === 0) {
      current.text += ` ${text}`;
    }
  }

  finishQuestion();

  if (questions.length === 0 && errors.length === 0) {
    errors.push(
      "Word faylidan savollar topilmadi. Hujjat formatini tekshiring.",
    );
  }

  return {
    questions,
    errors,
  };
};

type WrappedHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => unknown;

const wrap =
  (fn: WrappedHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

router.post(
  "/admin/exams/parse-word",
  allow("admin", "teacher"),
  wordUpload.single("file"),
  wrap(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Word fayl yuklanmadi.",
      });
    }

    let converted;

    try {
      converted = await mammoth.convertToHtml(
        { buffer: req.file.buffer },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
            const imageBuffer = await image.read("base64");

            return {
              src: `data:${image.contentType};base64,${imageBuffer}`,
            };
          }),
        },
      );
    } catch {
      return res.status(400).json({
        success: false,
        message: "Word faylini o'qib bo'lmadi. .docx formatini tekshiring.",
      });
    }

    const parsed = parseWordQuestions(converted.value);

    return sendData(res, {
      questions: parsed.questions,
      errors: parsed.errors,
      warnings: converted.messages
        .filter((message) => message.type === "warning")
        .map((message) => message.message),
      totalQuestions: parsed.questions.length,
    });
  }),
);

const examInclude = {
  subject: true,
  targetClasses: { include: { class: true } },
  questions: true,
  creator: true,
} as const;
const toExam = (e: any, includeAnswers = true) => ({
  id: e.id,
  title: e.title,
  description: e.description,
  subjectId: e.subjectId,
  subjectName: e.subject.name,
  targetClassIds: e.targetClasses.map((x: any) => x.classId),
  targetClassNames: e.targetClasses.map((x: any) => x.class.name),
  startDateTime: e.startDateTime.toISOString(),
  endDateTime: e.endDateTime.toISOString(),
  durationMinutes: e.durationMinutes,
  totalQuestions: e.questions.length,
  totalPoints: e.questions.reduce((s: number, q: any) => s + q.points, 0),
  passingScore: e.passingScore,
  isPublished: e.isPublished,
  areResultsReleased: e.areResultsReleased,
  isAnalysisReleased: e.isAnalysisReleased,
  createdByTeacherId: e.creatorId,
  createdByName: e.creator.fullName,
  createdAt: e.createdAt.toISOString(),
  questions: e.questions.map((q: any) => ({
    id: q.id,
    questionNumber: q.questionNumber,
    text: q.text,
    imageUrl: q.imageUrl,
    options: q.options,
    points: q.points,
    ...(includeAnswers
      ? { correctOptionId: q.correctOptionId, explanation: q.explanation }
      : {}),
  })),
});
const toResult = (r: any) => ({
  id: r.id,
  examId: r.examId,
  examTitle: r.exam.title,
  subjectName: r.exam.subject.name,
  studentId: r.studentId,
  studentName: r.student.fullName,
  studentCode: r.student.studentCode ?? "",
  className: r.student.class?.name ?? "",
  totalQuestions: r.exam.questions.length,
  correctAnswers: r.correctAnswers,
  incorrectAnswers: r.incorrectAnswers,
  unansweredCount: r.unansweredCount,
  score: r.score,
  totalPoints: r.totalPoints,
  percentage: r.percentage,
  isPassed: r.isPassed,
  completedAt: r.completedAt.toISOString(),
  isReleased: r.exam.areResultsReleased,
  isAnalysisReleased: r.exam.isAnalysisReleased,
  studentAnswers: r.studentAnswers,
});

// Student profile, available exams and exam session
router.get(
  "/student/profile",
  allow("student"),
  wrap(async (req, res) => {
    const u = await prisma.user.findUnique({
      where: { id: req.authUser!.id },
      include: {
        class: true,
        assignedClasses: true,
        assignedSubjects: { include: { subject: true } },
      },
    });
    return sendData(res, safeUser(u));
  }),
);
router.get(
  "/student/exams",
  allow("student"),
  wrap(async (req, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
    const exams = await prisma.exam.findMany({
      where: {
        isPublished: true,
        targetClasses: { some: { classId: u?.classId ?? "" } },
      },
      include: examInclude,
      orderBy: { startDateTime: "desc" },
    });
    return sendData(
      res,
      exams.map((e) => {
        const x = toExam(e, false);
        delete (x as any).questions;
        return x;
      }),
    );
  }),
);
router.get(
  "/student/exams/:id",
  allow("student"),
  wrap(async (req, res) => {
    const exam = await prisma.exam.findFirst({
      where: {
        id: String(String(req.params.id)),
        isPublished: true,
        targetClasses: {
          some: { class: { users: { some: { id: req.authUser!.id } } } },
        },
      },
      include: examInclude,
    });
    if (!exam)
      return res.status(404).json({
        success: false,
        message: "Test topilmadi yoki sinfingiz uchun ochilmagan.",
      });
    const now = new Date();
    if (now < exam.startDateTime)
      return res
        .status(403)
        .json({ success: false, message: "Test hali boshlanmagan." });
    if (now > exam.endDateTime)
      return res
        .status(403)
        .json({ success: false, message: "Test muddati tugagan." });
    const expiresAt = new Date(
      Math.min(
        now.getTime() + exam.durationMinutes * 60000,
        exam.endDateTime.getTime(),
      ),
    );
    const session = await prisma.examSession.upsert({
      where: {
        examId_studentId: { examId: exam.id, studentId: req.authUser!.id },
      },
      create: { examId: exam.id, studentId: req.authUser!.id, expiresAt },
      update: {},
    });
    const previousSession = await prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId: exam.id,
          studentId: req.authUser!.id,
        },
      },
    });

    if (previousSession?.submittedAt) {
      return res.status(403).json({
        success: false,
        message: "Siz bu testni avval topshirgansiz.",
      });
    }
    const answers = await prisma.examAnswer.findMany({
      where: { sessionId: session.id },
    });
    return sendData(res, {
      exam: toExam(exam, false),
      session: {
        examId: exam.id,
        studentId: req.authUser!.id,
        startedAt: session.startedAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        answers: Object.fromEntries(
          answers.map((a) => [a.questionId, a.optionId]),
        ),
        flaggedQuestionIds: session.flaggedQuestionIds,
        isSubmitted: !!session.submittedAt,
        submittedAt: session.submittedAt?.toISOString(),
      },
    });
  }),
);
router.post(
  "/student/exams/:id/answer",
  allow("student"),
  wrap(async (req, res) => {
    const { questionId, optionId } = z
      .object({
        questionId: z.string(),
        optionId: z.enum(["A", "B", "C", "D"]),
      })
      .parse(req.body);
    const s = await prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId: String(String(req.params.id)),
          studentId: req.authUser!.id,
        },
      },
    });
    if (!s || s.submittedAt || new Date() > s.expiresAt)
      return res
        .status(400)
        .json({ success: false, message: "Test sessiyasi yopilgan." });
    const q = await prisma.question.findFirst({
      where: { id: questionId, examId: String(req.params.id) },
    });
    if (!q || !(q.options as any[]).some((o) => o.id === optionId))
      return res
        .status(400)
        .json({ success: false, message: "Javob varianti noto‘g‘ri." });
    await prisma.examAnswer.upsert({
      where: { sessionId_questionId: { sessionId: s.id, questionId } },
      create: { sessionId: s.id, questionId, optionId },
      update: { optionId },
    });
    const refreshed = await prisma.examSession.findUnique({
      where: { id: s.id },
      include: { answers: true },
    });
    return sendData(res, {
      examId: String(req.params.id),
      studentId: req.authUser!.id,
      startedAt: refreshed!.startedAt.toISOString(),
      expiresAt: refreshed!.expiresAt.toISOString(),
      answers: Object.fromEntries(
        refreshed!.answers.map((a) => [a.questionId, a.optionId]),
      ),
      flaggedQuestionIds: refreshed!.flaggedQuestionIds,
      isSubmitted: !!refreshed!.submittedAt,
      submittedAt: refreshed!.submittedAt?.toISOString(),
    });
  }),
);
router.post(
  "/student/exams/:id/flag",
  allow("student"),
  wrap(async (req, res) => {
    const { questionId } = z.object({ questionId: z.string() }).parse(req.body);
    const s = await prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId: String(req.params.id),
          studentId: req.authUser!.id,
        },
      },
    });
    if (!s || s.submittedAt || new Date() > s.expiresAt)
      return res
        .status(400)
        .json({ success: false, message: "Sessiya topilmadi." });
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        examId: String(req.params.id),
      },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Savol ushbu imtihonga tegishli emas.",
      });
    }
    const ids = s.flaggedQuestionIds.includes(questionId)
      ? s.flaggedQuestionIds.filter((x) => x !== questionId)
      : [...s.flaggedQuestionIds, questionId];
    await prisma.examSession.update({
      where: { id: s.id },
      data: { flaggedQuestionIds: ids },
    });
    return sendData(res, ids);
  }),
);

router.post(
  "/student/exams/:id/submit",
  allow("student"),
  wrap(async (req, res) => {
    const examId = String(req.params.id);
    const studentId = req.authUser!.id;

    const outcome = await prisma.$transaction(async (tx) => {
      const claim = await tx.examSession.updateMany({
        where: {
          examId,
          studentId,
          submittedAt: null,
        },
        data: {
          submittedAt: new Date(),
        },
      });

      if (claim.count !== 1) {
        const existing = await tx.examSession.findUnique({
          where: {
            examId_studentId: {
              examId,
              studentId,
            },
          },
        });

        return existing
          ? { error: "already-submitted" as const }
          : { error: "not-found" as const };
      }

      const s = await tx.examSession.findUnique({
        where: {
          examId_studentId: {
            examId,
            studentId,
          },
        },
        include: {
          answers: true,
          exam: {
            include: {
              subject: true,
              questions: true,
            },
          },
        },
      });

      if (!s) {
        throw new Error("Session not found during submission.");
      }

      const ans = Object.fromEntries(
        s.answers.map((a) => [a.questionId, a.optionId]),
      );

      let correct = 0;
      let score = 0;

      const total = s.exam.questions.reduce((n, q) => n + q.points, 0);

      for (const q of s.exam.questions) {
        if (ans[q.id] === q.correctOptionId) {
          correct++;
          score += q.points;
        }
      }

      const unanswered = s.exam.questions.length - s.answers.length;

      const r = await tx.examResult.create({
        data: {
          examId: s.examId,
          studentId,
          correctAnswers: correct,
          incorrectAnswers: s.exam.questions.length - correct - unanswered,
          unansweredCount: unanswered,
          score,
          totalPoints: total,
          percentage: total ? (score / total) * 100 : 0,
          isPassed: total
            ? (score / total) * 100 >= s.exam.passingScore
            : false,
          studentAnswers: ans,
          questionSnapshot: JSON.parse(JSON.stringify(s.exam.questions)),
        },
      });

      const full = await tx.examResult.findUnique({
        where: { id: r.id },
        include: {
          exam: {
            include: {
              subject: true,
              questions: true,
            },
          },
          student: {
            include: {
              class: true,
            },
          },
        },
      });

      return { full };
    });

    if ("error" in outcome) {
      if (outcome.error === "not-found") {
        return res.status(404).json({
          success: false,
          message: "Sessiya topilmadi.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Test avval topshirilgan.",
      });
    }

    return sendData(res, toResult(outcome.full));
  }),
);

router.get(
  "/student/results",
  allow("student"),
  wrap(async (req, res) => {
    const rows = await prisma.examResult.findMany({
      where: {
        studentId: req.authUser!.id,
      },
      include: {
        exam: { include: { subject: true, questions: true } },
        student: { include: { class: true } },
      },
      orderBy: { completedAt: "desc" },
    });
    return sendData(res, rows.map(toResult));
  }),
);

// Exam CRUD shared by admin and teachers
router.get(
  "/exams",
  allow("admin", "teacher"),
  wrap(async (req, res) => {
    const where =
      req.authUser!.role === "teacher" ? { creatorId: req.authUser!.id } : {};
    const rows = await prisma.exam.findMany({
      where,
      include: examInclude,
      orderBy: { createdAt: "desc" },
    });
    return sendData(
      res,
      rows.map((e) => toExam(e)),
    );
  }),
);
router.get(
  "/exams/:id",
  allow("admin", "teacher"),
  wrap(async (req, res) => {
    const e = await prisma.exam.findUnique({
      where: { id: String(req.params.id) },
      include: examInclude,
    });
    if (!e)
      return res
        .status(404)
        .json({ success: false, message: "Test topilmadi." });

    if (req.authUser!.role === "teacher" && e.creatorId !== req.authUser!.id) {
      return res.status(403).json({
        success: false,
        message: "Bu imtihonni ko'rishga ruxsat yo'q.",
      });
    }

    return sendData(res, toExam(e));
  }),
);
const examInput = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  subjectId: z.string(),
  targetClassIds: z.array(z.string()).min(1),
  startDateTime: z.string(),
  endDateTime: z.string(),
  durationMinutes: z.number().int().positive(),
  passingScore: z.number().min(0).max(100).optional(),
  isPublished: z.boolean().optional(),
  areResultsReleased: z.boolean().optional(),
  isAnalysisReleased: z.boolean().optional(),
  questions: z.array(
    z.object({
      id: z.string().optional(),
      questionNumber: z.number().int().positive(),
      text: z.string().min(1),
      imageUrl: z.string().nullable().optional(),
      options: z
        .array(z.object({ id: z.enum(["A", "B", "C", "D"]), text: z.string() }))
        .min(2),
      correctOptionId: z.enum(["A", "B", "C", "D"]).optional(),
      points: z.number().positive(),
      explanation: z.string().nullable().optional(),
    }),
  ),
});
async function persistExam(
  id: string | undefined,
  body: any,
  creatorId: string,
) {
  const d = examInput.parse(body);
  const base: any = {
    title: d.title,
    description: d.description ?? "",
    subjectId: d.subjectId,
    creatorId,
    startDateTime: new Date(d.startDateTime),
    endDateTime: new Date(d.endDateTime),
    durationMinutes: d.durationMinutes,
    passingScore: d.passingScore ?? 60,
    isPublished: d.isPublished ?? false,
    areResultsReleased: d.areResultsReleased ?? false,
    isAnalysisReleased: d.isAnalysisReleased ?? false,
  };
  const relations: any = {
    targetClasses: { create: d.targetClassIds.map((classId) => ({ classId })) },
    questions: {
      create: d.questions.map((q) => ({
        questionNumber: q.questionNumber,
        text: q.text,
        imageUrl: q.imageUrl,
        options: q.options,
        correctOptionId: q.correctOptionId,
        points: q.points,
        explanation: q.explanation,
      })),
    },
  };
  if (!id)
    return prisma.exam.create({
      data: { ...base, ...relations },
      include: examInclude,
    });
  return prisma.exam.update({
    where: { id },
    data: {
      ...base,
      targetClasses: { deleteMany: {}, ...relations.targetClasses },
      questions: { deleteMany: {}, ...relations.questions },
    },
    include: examInclude,
  });
}
router.post(
  "/exams",
  allow("admin", "teacher"),
  wrap(async (req, res) => {
    const examData = req.body;

    if (req.authUser!.role === "teacher") {
      const [subjectAssignment, classAssignments] = await Promise.all([
        prisma.teacherSubject.findUnique({
          where: {
            teacherId_subjectId: {
              teacherId: req.authUser!.id,
              subjectId: examData.subjectId,
            },
          },
        }),
        prisma.teacherClass.findMany({
          where: {
            teacherId: req.authUser!.id,
            classId: { in: examData.targetClassIds },
          },
          select: { classId: true },
        }),
      ]);

      if (
        !subjectAssignment ||
        classAssignments.length !== examData.targetClassIds.length
      ) {
        return res.status(403).json({
          success: false,
          message: "Bu fan yoki sinf sizga biriktirilmagan.",
        });
      }
    }

    return sendData(
      res,
      toExam(await persistExam(undefined, examData, req.authUser!.id)),
      201,
    );
  }),
);
router.put(
  "/exams/:id",
  allow("admin", "teacher"),
  wrap(async (req, res) => {
    const old = await prisma.exam.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!old)
      return res
        .status(404)
        .json({ success: false, message: "Test topilmadi." });
    if (req.authUser!.role === "teacher" && old.creatorId !== req.authUser!.id)
      return res.status(403).json({ success: false, message: "Ruxsat yo‘q." });
    const examData = req.body;

    if (req.authUser!.role === "teacher") {
      const [subjectAssignment, classAssignments] = await Promise.all([
        prisma.teacherSubject.findUnique({
          where: {
            teacherId_subjectId: {
              teacherId: req.authUser!.id,
              subjectId: examData.subjectId,
            },
          },
        }),
        prisma.teacherClass.findMany({
          where: {
            teacherId: req.authUser!.id,
            classId: { in: examData.targetClassIds },
          },
          select: { classId: true },
        }),
      ]);

      if (
        !subjectAssignment ||
        classAssignments.length !== examData.targetClassIds.length
      ) {
        return res.status(403).json({
          success: false,
          message: "Bu fan yoki sinf sizga biriktirilmagan.",
        });
      }
    }
    return sendData(
      res,
      toExam(await persistExam(String(req.params.id), req.body, old.creatorId)),
    );
  }),
);
router.delete(
  "/exams/:id",
  allow("admin", "teacher"),
  wrap(async (req, res) => {
    const old = await prisma.exam.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!old)
      return res
        .status(404)
        .json({ success: false, message: "Test topilmadi." });
    if (req.authUser!.role === "teacher" && old.creatorId !== req.authUser!.id)
      return res.status(403).json({ success: false, message: "Ruxsat yo‘q." });
    await prisma.exam.delete({ where: { id: String(req.params.id) } });
    return sendData(res, { deleted: true });
  }),
);
router.patch(
  "/exams/:id/publish",
  allow("admin", "teacher"),
  wrap(async (req, res) => {
    const old = await prisma.exam.findUnique({
      where: { id: String(req.params.id) },
      include: {
        targetClasses: true,
      },
    });
    if (!old)
      return res
        .status(404)
        .json({ success: false, message: "Test topilmadi." });
    if (req.authUser!.role === "teacher" && old.creatorId !== req.authUser!.id)
      return res.status(403).json({ success: false, message: "Ruxsat yo‘q." });
    if (req.authUser!.role === "teacher") {
      const [subjectAssignment, classAssignments] = await Promise.all([
        prisma.teacherSubject.findUnique({
          where: {
            teacherId_subjectId: {
              teacherId: req.authUser!.id,
              subjectId: old.subjectId,
            },
          },
        }),
        prisma.teacherClass.findMany({
          where: {
            teacherId: req.authUser!.id,
            classId: {
              in: old.targetClasses.map((c) => c.classId),
            },
          },
          select: { classId: true },
        }),
      ]);

      if (
        !subjectAssignment ||
        classAssignments.length !== old.targetClasses.length
      ) {
        return res.status(403).json({
          success: false,
          message: "Bu fan yoki sinf sizga biriktirilmagan.",
        });
      }
    }
    const e = await prisma.exam.update({
      where: { id: String(req.params.id) },
      data: { isPublished: !old.isPublished },
      include: examInclude,
    });
    return sendData(res, toExam(e));
  }),
);
router.patch(
  "/exams/:id/release-results",
  allow("admin"),
  wrap(async (req, res) => {
    const { isReleased } = z
      .object({ isReleased: z.boolean() })
      .parse(req.body);
    return sendData(
      res,
      await prisma.exam.update({
        where: { id: String(req.params.id) },
        data: { areResultsReleased: isReleased },
      }),
    );
  }),
);
router.patch(
  "/exams/:id/release-analysis",
  allow("admin"),
  wrap(async (req, res) => {
    const { isAnalysisReleased } = z
      .object({
        isAnalysisReleased: z.boolean(),
      })
      .parse(req.body);

    const exam = await prisma.exam.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Imtihon topilmadi.",
      });
    }

    const updated = await prisma.exam.update({
      where: { id: exam.id },
      data: { isAnalysisReleased },
    });

    return sendData(res, {
      id: updated.id,
      isAnalysisReleased: updated.isAnalysisReleased,
    });
  }),
);
// Results
router.get(
  "/results",
  allow("admin", "teacher"),
  wrap(async (req, res) => {
    const where: any = {};
    if (req.query.examId && req.query.examId !== "all")
      where.examId = String(req.query.examId);
    if (req.query.className && req.query.className !== "all")
      where.student = { class: { name: String(req.query.className) } };
    if (req.authUser!.role === "teacher")
      where.exam = { creatorId: req.authUser!.id };
    const rows = await prisma.examResult.findMany({
      where,
      include: {
        exam: { include: { subject: true, questions: true } },
        student: { include: { class: true } },
      },
      orderBy: { completedAt: "desc" },
    });
    return sendData(res, rows.map(toResult));
  }),
);
router.get(
  "/results/:id",
  allow("admin", "teacher", "student"),
  wrap(async (req, res) => {
    const r = await prisma.examResult.findFirst({
      where: {
        OR: [
          { id: String(req.params.id) },
          { examId: String(req.params.id), studentId: req.authUser!.id },
        ],
      },
      include: {
        exam: { include: { subject: true, questions: true } },
        student: { include: { class: true } },
      },
    });
    if (!r)
      return res
        .status(404)
        .json({ success: false, message: "Natija topilmadi." });
    if (req.authUser!.role === "student" && r.studentId !== req.authUser!.id)
      return res
        .status(403)
        .json({ success: false, message: "Natija hali e’lon qilinmagan." });
    if (
      req.authUser!.role === "teacher" &&
      r.exam.creatorId !== req.authUser!.id
    )
      return res.status(403).json({
        success: false,
        message: "Bu natijani ko‘rishga ruxsat yo‘q.",
      });
    return sendData(res, toResult(r));
  }),
);
router.get(
  "/student/results/:id/analysis",
  allow("student"),
  wrap(async (req, res) => {
    const result = await prisma.examResult.findFirst({
      where: {
        id: String(req.params.id),
        studentId: req.authUser!.id,
      },
      include: {
        exam: {
          include: examInclude,
        },
      },
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Natija topilmadi.",
      });
    }

    if (!result.exam.isAnalysisReleased) {
      return res.status(403).json({
        success: false,
        message: "Test tahlili hali ochilmagan.",
      });
    }

    const snapshot = result.questionSnapshot;

    if (!Array.isArray(snapshot)) {
      return res.status(409).json({
        success: false,
        message: "Bu natija uchun savollar nusxasi mavjud emas.",
      });
    }

    const examForAnalysis = {
      ...result.exam,
      questions: snapshot,
    };

    return sendData(res, toExam(examForAnalysis, true));
  }),
);
router.get(
  "/teacher/classes",
  allow("teacher"),
  wrap(async (req, res) => {
    const rows = await prisma.classGroup.findMany({
      where: { teacherLinks: { some: { teacherId: req.authUser!.id } } },
      include: { users: true, teacherLinks: { include: { teacher: true } } },
    });
    return sendData(
      res,
      rows.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        stream: c.stream,
        academicYear: c.academicYear,
        studentCount: c.users.length,
        classTeacherName: c.teacherLinks[0]?.teacher.fullName,
        createdAt: c.createdAt.toISOString(),
      })),
    );
  }),
);
router.get(
  "/teacher/exams",
  allow("teacher"),
  wrap(async (req, res) => {
    const rows = await prisma.exam.findMany({
      where: { creatorId: req.authUser!.id },
      include: examInclude,
    });
    return sendData(
      res,
      rows.map((e) => toExam(e)),
    );
  }),
);
router.get(
  "/teacher/results",
  allow("teacher"),
  wrap(async (req, res) => {
    const teacherId = req.authUser!.id;

    const teacherClasses = await prisma.teacherClass.findMany({
      where: { teacherId },
      select: { classId: true },
    });

    const classIds = teacherClasses.map((item) => item.classId);

    const rows = await prisma.examResult.findMany({
      where: {
        OR: [
          { exam: { creatorId: teacherId } },
          { student: { classId: { in: classIds } } },
        ],
      },
      include: {
        exam: {
          include: {
            subject: true,
            questions: true,
          },
        },
        student: {
          include: {
            class: true,
          },
        },
      },
    });

    return sendData(res, rows.map(toResult));
  }),
);

// Admin users, classes, subjects and dashboard
router.get(
  "/admin/stats",
  allow("admin"),
  wrap(async (req, res) => {
    const [students, teachers, exams, completed, active] = await Promise.all([
      prisma.user.count({ where: { role: "student" } }),
      prisma.user.count({ where: { role: "teacher" } }),
      prisma.exam.count(),
      prisma.examResult.count(),
      prisma.exam.count({
        where: { isPublished: true, endDateTime: { gt: new Date() } },
      }),
    ]);
    return sendData(res, {
      totalStudents: students,
      totalTeachers: teachers,
      totalExaminations: exams,
      completedExaminations: completed,
      activeExaminations: active,
      recentActivity: [],
    });
  }),
);
router.get(
  "/admin/students",
  allow("admin"),
  wrap(async (req, res) => {
    const rows = await prisma.user.findMany({
      where: { role: "student" },
      include: { class: true },
    });
    return sendData(res, rows.map(safeUser));
  }),
);
router.post(
  "/admin/students",
  allow("admin"),
  wrap(async (req, res) => {
    const d = z
      .object({
        username: z.string().min(3),
        password: z.string().min(6),
        fullName: z.string().min(2),
        email: z.string().email(),
        studentId: z.string().min(1),
        classId: z.string().min(1),
        status: z.enum(["active", "inactive"]).optional(),
      })
      .parse(req.body);

    const bcrypt = await import("bcryptjs");

    const student = await prisma.user.create({
      data: {
        username: d.username,
        passwordHash: await bcrypt.hash(d.password, 12),
        fullName: d.fullName,
        email: d.email,
        studentCode: d.studentId,
        classId: d.classId,
        status: d.status ?? "active",
        role: "student",
      },
      include: {
        class: true,
      },
    });

    return sendData(res, safeUser(student), 201);
  }),
);
router.get(
  "/admin/teachers",
  allow("admin"),
  wrap(async (req, res) => {
    const teachers = await prisma.user.findMany({
      where: { role: "teacher" },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        status: true,
        assignedClasses: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                grade: true,
                stream: true,
              },
            },
          },
        },
        assignedSubjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    const data = teachers.map((teacher) => ({
      subjects: teacher.assignedSubjects.map((link) => link.subject),
      id: teacher.id,
      fullName: teacher.fullName,
      username: teacher.username,
      email: teacher.email,
      status: teacher.status,
      classes: teacher.assignedClasses.map((link) => link.class),
    }));

    return sendData(res, data);
  }),
);
router.post(
  "/admin/teachers",
  allow("admin"),
  wrap(async (req, res) => {
    const d = z
      .object({
        username: z.string().min(3),
        password: z.string().min(6),
        fullName: z.string().min(2),
        email: z.string().email(),
        status: z.enum(["active", "inactive"]).optional(),
      })
      .parse(req.body);

    const bcrypt = await import("bcryptjs");

    const teacher = await prisma.user.create({
      data: {
        username: d.username,
        passwordHash: await bcrypt.hash(d.password, 12),
        fullName: d.fullName,
        email: d.email,
        status: d.status ?? "active",
        role: "teacher",
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        status: true,
        role: true,
      },
    });

    return sendData(res, teacher, 201);
  }),
);
router.put(
  "/admin/students/:id",
  allow("admin"),
  wrap(async (req, res) => {
    const d = z
      .object({
        fullName: z.string().optional(),
        email: z.string().email().optional(),
        classId: z.string().nullable().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        studentId: z.string().optional(),
      })
      .parse(req.body);

    const id = String(req.params.id);

    const existing = await prisma.user.findFirst({
      where: {
        id,
        role: "student",
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "O'quvchi topilmadi.",
      });
    }

    const { studentId, ...userFields } = d;

    const u = await prisma.user.update({
      where: { id },
      data: {
        ...userFields,
        ...(studentId !== undefined ? { studentCode: studentId } : {}),
      },
      include: { class: true },
    });

    return sendData(res, safeUser(u));
  }),
);
router.delete(
  "/admin/students/:id",
  allow("admin"),
  wrap(async (req, res) => {
    const id = String(req.params.id);

    const student = await prisma.user.findFirst({
      where: {
        id,
        role: "student",
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "O'quvchi topilmadi.",
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    return sendData(res, { deleted: true });
  }),
);
router.get(
  "/admin/classes",
  allow("admin"),
  wrap(async (req, res) => {
    const rows = await prisma.classGroup.findMany({
      include: { users: true, teacherLinks: { include: { teacher: true } } },
    });
    return sendData(
      res,
      rows.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        stream: c.stream,
        academicYear: c.academicYear,
        studentCount: c.users.length,
        createdAt: c.createdAt.toISOString(),
        teacherId: c.teacherLinks[0]?.teacherId || "",
        classTeacherName: c.classTeacherName,
      })),
    );
  }),
);
router.post(
  "/admin/classes",
  allow("admin"),
  wrap(async (req, res) => {
    const d = z
      .object({
        name: z.string().min(1),
        grade: z.coerce.number(),
        stream: z.string().optional().nullable(),
        academicYear: z.string(),
        classTeacherName: z.string().optional().nullable(),
      })
      .parse(req.body);

    const c = await prisma.classGroup.create({
      data: {
        ...d,
      },
    });

    return sendData(
      res,
      {
        ...c,
        studentCount: 0,
      },
      201,
    );
  }),
);
router.put(
  "/admin/classes/:id",
  allow("admin"),
  wrap(async (req, res) => {
    const d = z
      .object({
        name: z.string().min(1).optional(),
        grade: z.coerce.number().optional(),
        stream: z.string().nullable().optional(),
        academicYear: z.string().optional(),
        classTeacherName: z.string().nullable().optional(),
      })
      .parse(req.body);

    const id = String(req.params.id);

    const existing = await prisma.classGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Sinf topilmadi.",
      });
    }

    const c = await prisma.classGroup.update({
      where: { id },
      data: d,
      include: {
        users: true,
        teacherLinks: true,
      },
    });

    return sendData(res, {
      id: c.id,
      name: c.name,
      grade: c.grade,
      stream: c.stream,
      academicYear: c.academicYear,
      studentCount: c.users.length,
      createdAt: c.createdAt.toISOString(),
      teacherId: c.teacherLinks[0]?.teacherId || "",
      classTeacherName: c.classTeacherName,
    });
  }),
);
router.post(
  "/admin/teachers/:id/classes",
  allow("admin"),
  wrap(async (req, res) => {
    const d = z
      .object({
        classIds: z.array(z.string()).min(1),
      })
      .parse(req.body);

    const teacherId = String(req.params.id);

    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: "teacher",
      },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "O'qituvchi topilmadi.",
      });
    }

    const assignments = await prisma.$transaction(
      d.classIds.map((classId) =>
        prisma.teacherClass.upsert({
          where: {
            teacherId_classId: {
              teacherId,
              classId,
            },
          },
          update: {},
          create: {
            teacherId,
            classId,
          },
        }),
      ),
    );

    return sendData(res, assignments);
  }),
);
router.post(
  "/admin/teachers/:id/subjects",
  allow("admin"),
  wrap(async (req, res) => {
    const d = z
      .object({
        subjectIds: z.array(z.string()),
      })
      .parse(req.body);

    const teacherId = String(req.params.id);

    const teacher = await prisma.user.findFirst({
      where: { id: teacherId, role: "teacher" },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "O'qituvchi topilmadi.",
      });
    }

    const assignments = await prisma.$transaction(
      d.subjectIds.map((subjectId) =>
        prisma.teacherSubject.upsert({
          where: {
            teacherId_subjectId: {
              teacherId,
              subjectId,
            },
          },
          update: {},
          create: {
            teacherId,
            subjectId,
          },
        }),
      ),
    );

    return sendData(res, assignments);
  }),
);
router.get(
  "/admin/subjects",
  allow("admin"),
  wrap(async (req, res) => {
    const rows = await prisma.subject.findMany();
    return sendData(
      res,
      rows.map((s) => ({
        ...s,
        status: s.status === "active" ? "active" : "inactive",
      })),
    );
  }),
);
router.get(
  "/teacher/subjects",
  allow("teacher"),
  wrap(async (req, res) => {
    const rows = await prisma.teacherSubject.findMany({
      where: {
        teacherId: req.authUser!.id,
      },
      include: {
        subject: true,
      },
    });

    return sendData(
      res,
      rows.map((r) => ({
        ...r.subject,
        status: r.subject.status === "active" ? "active" : "inactive",
      })),
    );
  }),
);
router.post(
  "/admin/subjects",
  allow("admin"),
  wrap(async (req, res) => {
    const s = await prisma.subject.create({
      data: z
        .object({
          name: z.string(),
          code: z.string(),
          description: z.string().optional(),
        })
        .parse(req.body),
    });
    return sendData(res, s, 201);
  }),
);
router.put(
  "/admin/subjects/:id",
  allow("admin"),
  wrap(async (req, res) => {
    const s = await prisma.subject.update({
      where: { id: String(req.params.id) },
      data: req.body,
    });
    return sendData(res, s);
  }),
);
router.put(
  "/admin/teachers/:id",
  allow("admin"),
  wrap(async (req, res) => {
    const d = z
      .object({
        fullName: z.string().min(2),
        username: z.string().min(3),
        email: z.string().email(),
        status: z.enum(["active", "inactive"]).optional(),
      })
      .parse(req.body);

    const teacher = await prisma.user.update({
      where: {
        id: String(req.params.id),
        role: "teacher",
      },
      data: d,
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        status: true,
      },
    });

    return sendData(res, teacher);
  }),
);
router.delete(
  "/admin/teachers/:id",
  allow("admin"),
  wrap(async (req, res) => {
    const teacherId = String(req.params.id);

    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: "teacher",
      },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "O'qituvchi topilmadi.",
      });
    }

    await prisma.user.delete({
      where: {
        id: teacherId,
      },
    });

    return sendData(res, {
      message: "O'qituvchi muvaffaqiyatli o'chirildi.",
    });
  }),
);
router.delete(
  "/admin/subjects/:id",
  allow("admin"),
  wrap(async (req, res) => {
    await prisma.subject.delete({ where: { id: String(req.params.id) } });
    return sendData(res, { deleted: true });
  }),
);
export default router;
