import { useState, useEffect, useRef } from 'react';
import { calculateRemainingSeconds, formatDuration } from '../utils/examCalculations';

interface UseExamTimerOptions {
  expiresAtIso?: string;
  totalDurationMinutes?: number;
  onExpire?: () => void;
  autoStart?: boolean;
}

export function useExamTimer({
  expiresAtIso,
  totalDurationMinutes = 45,
  onExpire,
  autoStart = true,
}: UseExamTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (!expiresAtIso) return totalDurationMinutes * 60;
    return calculateRemainingSeconds(expiresAtIso);
  });

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!autoStart || !expiresAtIso) return;

    // Initial check
    const initialSec = calculateRemainingSeconds(expiresAtIso);
    setRemainingSeconds(initialSec);

    if (initialSec <= 0) {
      if (!hasTriggeredRef.current && onExpireRef.current) {
        hasTriggeredRef.current = true;
        onExpireRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      const sec = calculateRemainingSeconds(expiresAtIso);
      setRemainingSeconds(sec);

      if (sec <= 0) {
        clearInterval(interval);
        if (!hasTriggeredRef.current && onExpireRef.current) {
          hasTriggeredRef.current = true;
          onExpireRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAtIso, autoStart]);

  const totalSeconds = totalDurationMinutes * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100));
  const isWarning = remainingSeconds <= 300 && remainingSeconds > 60; // 5 mins
  const isCritical = remainingSeconds <= 60 && remainingSeconds > 0; // 1 min

  return {
    remainingSeconds,
    formattedTime: formatDuration(remainingSeconds),
    isWarning,
    isCritical,
    isExpired: remainingSeconds <= 0,
    progressPercent,
  };
}
