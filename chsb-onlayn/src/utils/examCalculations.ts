import { Exam, Question, ExamResult, ExamStatus } from '../types';

/**
 * Calculates time remaining in seconds given an expiration ISO string or timestamp.
 * Clamps to 0 so it never goes negative.
 */
export function calculateRemainingSeconds(targetTimeIso: string, currentTimeMs = Date.now()): number {
  const targetMs = new Date(targetTimeIso).getTime();
  if (isNaN(targetMs)) return 0;
  const diffSec = Math.floor((targetMs - currentTimeMs) / 1000);
  return Math.max(0, diffSec);
}

/**
 * Formats seconds into HH:MM:SS or MM:SS string
 */
export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Computes an examination's dynamic status for a student:
 * - 'completed': student has already submitted
 * - 'in_progress': student has an active session and deadline not exceeded
 * - 'available': currentTime is within startDateTime and endDateTime
 * - 'upcoming': currentTime is before startDateTime
 */
export function determineExamStatus(
  exam: Pick<Exam, 'startDateTime' | 'endDateTime'>,
  hasSubmitted = false,
  hasActiveSession = false,
  currentTimeMs = Date.now()
): ExamStatus {
  if (hasSubmitted) {
    return 'completed';
  }

  const startMs = new Date(exam.startDateTime).getTime();
  const endMs = new Date(exam.endDateTime).getTime();

  if (currentTimeMs < startMs) {
    return 'upcoming';
  }

  if (hasActiveSession) {
    return 'in_progress';
  }

  if (currentTimeMs >= startMs && currentTimeMs <= endMs) {
    return 'available';
  }

  return 'completed'; // Window expired
}

/**
 * Evaluates student answers against questions, returning detailed scoring metrics.
 */
export function calculateExamScore(
  questions: Question[],
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>,
  passingScore = 60
): {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredCount: number;
  score: number;
  totalPoints: number;
  percentage: number;
  isPassed: boolean;
} {
  const totalQuestions = questions.length;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let unansweredCount = 0;
  let score = 0;
  let totalPoints = 0;

  for (const q of questions) {
    const qPoints = q.points || 1;
    totalPoints += qPoints;
    const studentChoice = answers[q.id];

    if (!studentChoice) {
      unansweredCount++;
    } else if (q.correctOptionId && studentChoice === q.correctOptionId) {
      correctAnswers++;
      score += qPoints;
    } else {
      incorrectAnswers++;
    }
  }

  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const isPassed = percentage >= passingScore;

  return {
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    unansweredCount,
    score,
    totalPoints,
    percentage,
    isPassed,
  };
}

/**
 * Formats a date string for display in institutional Uzbek / International style
 */
export function formatExamDate(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (isNaN(d.getTime())) return dateIso;
    return d.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateIso;
  }
}
