import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRemainingSeconds,
  formatDuration,
  determineExamStatus,
  calculateExamScore,
} from './examCalculations';
import { Question } from '../types';

test('formatDuration formats hours, minutes, and seconds properly', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(45), '00:45');
  assert.equal(formatDuration(75), '01:15');
  assert.equal(formatDuration(3661), '01:01:01');
  assert.equal(formatDuration(-10), '00:00');
});

test('calculateRemainingSeconds handles future and past targets', () => {
  const baseTime = 1700000000000;
  const targetFuture = new Date(baseTime + 120 * 1000).toISOString();
  const targetPast = new Date(baseTime - 50 * 1000).toISOString();

  assert.equal(calculateRemainingSeconds(targetFuture, baseTime), 120);
  assert.equal(calculateRemainingSeconds(targetPast, baseTime), 0);
});

test('determineExamStatus computes correct status based on time windows', () => {
  const start = '2026-11-04T10:00:00Z';
  const end = '2026-11-04T12:00:00Z';

  // Before start
  assert.equal(
    determineExamStatus({ startDateTime: start, endDateTime: end }, false, false, new Date('2026-11-04T09:00:00Z').getTime()),
    'upcoming'
  );

  // During window - not started
  assert.equal(
    determineExamStatus({ startDateTime: start, endDateTime: end }, false, false, new Date('2026-11-04T10:30:00Z').getTime()),
    'available'
  );

  // During window - in progress
  assert.equal(
    determineExamStatus({ startDateTime: start, endDateTime: end }, false, true, new Date('2026-11-04T10:30:00Z').getTime()),
    'in_progress'
  );

  // After window
  assert.equal(
    determineExamStatus({ startDateTime: start, endDateTime: end }, false, false, new Date('2026-11-04T13:00:00Z').getTime()),
    'completed'
  );

  // Already submitted
  assert.equal(
    determineExamStatus({ startDateTime: start, endDateTime: end }, true, false, new Date('2026-11-04T10:30:00Z').getTime()),
    'completed'
  );
});

test('calculateExamScore computes correct points, percentage, and pass/fail', () => {
  const sampleQuestions: Question[] = [
    {
      id: 'q1',
      questionNumber: 1,
      text: 'What is 5 + 5?',
      options: [
        { id: 'A', text: '10' },
        { id: 'B', text: '11' },
      ],
      correctOptionId: 'A',
      points: 2,
    },
    {
      id: 'q2',
      questionNumber: 2,
      text: 'What is 3 * 3?',
      options: [
        { id: 'A', text: '6' },
        { id: 'B', text: '9' },
      ],
      correctOptionId: 'B',
      points: 3,
    },
    {
      id: 'q3',
      questionNumber: 3,
      text: 'What is 2^3?',
      options: [
        { id: 'A', text: '8' },
        { id: 'B', text: '6' },
      ],
      correctOptionId: 'A',
      points: 5,
    },
  ];

  // Perfect score
  const perfect = calculateExamScore(sampleQuestions, { q1: 'A', q2: 'B', q3: 'A' }, 60);
  assert.equal(perfect.totalQuestions, 3);
  assert.equal(perfect.correctAnswers, 3);
  assert.equal(perfect.incorrectAnswers, 0);
  assert.equal(perfect.unansweredCount, 0);
  assert.equal(perfect.score, 10);
  assert.equal(perfect.totalPoints, 10);
  assert.equal(perfect.percentage, 100);
  assert.equal(perfect.isPassed, true);

  // Partial score with unanswered
  const partial = calculateExamScore(sampleQuestions, { q1: 'A', q2: 'A' }, 60); // q1 correct (2), q2 wrong (0), q3 unanswered
  assert.equal(partial.correctAnswers, 1);
  assert.equal(partial.incorrectAnswers, 1);
  assert.equal(partial.unansweredCount, 1);
  assert.equal(partial.score, 2);
  assert.equal(partial.percentage, 20);
  assert.equal(partial.isPassed, false);
});
