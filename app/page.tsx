"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type RefObject } from "react";
import { createPortal } from "react-dom";
import SlideFrame from "../components/SlideFrame";
import SlideStage from "../components/SlideStage";
import QuestionSlide from "../components/QuestionSlide";
import HeartPhoto from "../components/HeartPhoto";
import type { StickerPlacement } from "../components/ValentineDecor";

type Stage = "intro" | "quiz" | "final" | "celebrate";

type Heart = {
  id: number;
  left: number;
  size: number;
  duration: number;
};

type Question = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  themeColor?: string;
  stickers?: StickerPlacement[];
};

const QUIZ_QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "What is Vedant's ideal Valentine snack?",
    options: ["Gourmet tacos", "Chocolate strawberries", "Spicy ramen", "Macarons"],
    correctIndex: 1,
    themeColor: "#ff6b9c",
    stickers: [
      { name: "drink", style: { top: 24, right: 40, transform: "rotate(6deg)" } },
      { name: "heart", className: "small", style: { bottom: 26, left: 30 } }
    ]
  },
  {
    id: "q2",
    prompt: "Pick a perfect Valentine's vibe.",
    options: ["Sunset picnic", "Arcade night", "Movie marathon", "Stargazing drive"],
    correctIndex: 0,
    themeColor: "#ff8fb1",
    stickers: [
      { name: "gift", style: { top: 20, left: 24, transform: "rotate(-4deg)" } },
      { name: "sparkles", className: "small", style: { bottom: 30, right: 36 } }
    ]
  },
  {
    id: "q3",
    prompt: "What's the official Valentine playlist mood?",
    options: ["Soft & sweet", "Hype & loud", "Indie & cozy", "Classic love songs"],
    correctIndex: 2,
    themeColor: "#ff5ea8",
    stickers: [
      { name: "bow", style: { top: 18, right: 36, transform: "rotate(8deg)" } },
      { name: "heart", className: "small", style: { bottom: 24, left: 36 } }
    ]
  }
];

const EVASIVE_CONFIG = {
  padding: 20,
  dangerRadius: 120,
  cooldownMs: 160,
  nudgeDistance: 60,
  transitionDuration: 220,
  minJump: 180,
  maxJump: 260,
  avoidPadding: 24
};

const HEARTS_CONFIG = {
  max: 24,
  spawnInterval: 220,
  duration: 3200
};

const CONFETTI_CONFIG = {
  count: 80
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function rectanglesOverlap(a: DOMRect, b: DOMRect, padding = 8) {
  const expanded = new DOMRect(
    b.x - padding,
    b.y - padding,
    b.width + padding * 2,
    b.height + padding * 2
  );
  return !(
    a.right < expanded.left ||
    a.left > expanded.right ||
    a.bottom < expanded.top ||
    a.top > expanded.bottom
  );
}

function createConfetti(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  count: number
) {
  const colors = ["#ff5ea8", "#ffd166", "#8ecae6", "#caffbf", "#ff99c8"];
  const particles = Array.from({ length: count }).map(() => ({
    x: width / 2,
    y: height / 2,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * -8 - 4,
    size: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * Math.PI
  }));

  let running = true;
  const gravity = 0.25;
  const start = performance.now();

  const animate = (time: number) => {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += 0.1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (time - start < 1400) {
      requestAnimationFrame(animate);
    } else {
      running = false;
      ctx.clearRect(0, 0, width, height);
    }
  };

  requestAnimationFrame(animate);

  return () => {
    running = false;
    ctx.clearRect(0, 0, width, height);
  };
}

function playPop(audioContextRef: MutableRefObject<AudioContext | null>) {
  const audioContext =
    audioContextRef.current ??
    new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

  audioContextRef.current = audioContext;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(640, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    180,
    audioContext.currentTime + 0.15
  );
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.14, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.18);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
}

function useEvasivePosition({
  buttonRef,
  avoidRef,
  anchorRef,
  boundsRef,
  enabled,
  reducedMotion,
  ready
}: {
  buttonRef: RefObject<HTMLButtonElement>;
  avoidRef: RefObject<HTMLElement>;
  anchorRef?: RefObject<HTMLElement>;
  boundsRef: RefObject<HTMLElement>;
  enabled: boolean;
  reducedMotion: boolean;
  ready?: boolean;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastMoveRef = useRef(0);
  const positionRef = useRef(position);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const moveButton = (force = false) => {
    if (!enabled) return;
    const now = Date.now();
    if (!force && now - lastMoveRef.current < EVASIVE_CONFIG.cooldownMs) {
      return;
    }

    const button = buttonRef.current;
    if (!button) return;

    const noRect = button.getBoundingClientRect();
    const avoidRect = avoidRef.current?.getBoundingClientRect();
    const bounds = boundsRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const minX = bounds.left + EVASIVE_CONFIG.padding;
    const maxX = bounds.right - noRect.width - EVASIVE_CONFIG.padding;
    const minY = bounds.top + EVASIVE_CONFIG.padding;
    const maxY = bounds.bottom - noRect.height - EVASIVE_CONFIG.padding;

    let nextX = positionRef.current.x;
    let nextY = positionRef.current.y;

    if (reducedMotion) {
      const dx = (Math.random() - 0.5) * EVASIVE_CONFIG.nudgeDistance;
      const dy = (Math.random() - 0.5) * EVASIVE_CONFIG.nudgeDistance;
      nextX = clamp(nextX + dx, minX, maxX);
      nextY = clamp(nextY + dy, minY, maxY);
      if (avoidRect) {
        const candidateRect = new DOMRect(nextX, nextY, noRect.width, noRect.height);
        if (rectanglesOverlap(candidateRect, avoidRect, EVASIVE_CONFIG.avoidPadding)) {
          const moveRight = candidateRect.x < avoidRect.x;
          const targetX = moveRight
            ? avoidRect.right + 16
            : avoidRect.left - noRect.width - 16;
          nextX = clamp(targetX, minX, maxX);
          nextY = clamp(avoidRect.top + Math.random() * 20 - 10, minY, maxY);
        }
      }
    } else {
      let attempts = 0;
      const minDistance =
        EVASIVE_CONFIG.minJump +
        Math.random() * (EVASIVE_CONFIG.maxJump - EVASIVE_CONFIG.minJump);
      while (attempts < 16) {
        const x = Math.random() * (maxX - minX) + minX;
        const y = Math.random() * (maxY - minY) + minY;
        const candidateRect = new DOMRect(x, y, noRect.width, noRect.height);
        const distance = Math.hypot(
          x - positionRef.current.x,
          y - positionRef.current.y
        );
        const farEnough = distance > minDistance;
        if (
          farEnough &&
          (!avoidRect ||
            !rectanglesOverlap(candidateRect, avoidRect, EVASIVE_CONFIG.avoidPadding))
        ) {
          nextX = x;
          nextY = y;
          break;
        }
        attempts += 1;
      }
    }

    lastMoveRef.current = now;
    setPosition({ x: nextX, y: nextY });
  };

  useLayoutEffect(() => {
    const button = buttonRef.current;
    const bounds = boundsRef.current;
    if (!button || !bounds) return;

    const boundsRect = bounds.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const anchorRect = anchorRef?.current?.getBoundingClientRect();

    let initialX = boundsRect.left + (boundsRect.width - buttonRect.width) / 2;
    let initialY = boundsRect.top + (boundsRect.height - buttonRect.height) / 2;

    if (anchorRect) {
      initialX = anchorRect.left + (anchorRect.width - buttonRect.width) / 2;
      initialY = anchorRect.top + (anchorRect.height - buttonRect.height) / 2;
    }

    setPosition({
      x: clamp(
        initialX,
        boundsRect.left + EVASIVE_CONFIG.padding,
        boundsRect.right - buttonRect.width - EVASIVE_CONFIG.padding
      ),
      y: clamp(
        initialY,
        boundsRect.top + EVASIVE_CONFIG.padding,
        boundsRect.bottom - buttonRect.height - EVASIVE_CONFIG.padding
      )
    });
  }, [anchorRef, avoidRef, buttonRef, boundsRef, ready]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!enabled) return;
      if (event.pointerType !== "mouse") return;
      if (reducedMotion) return;
      const button = buttonRef.current;
      const bounds = boundsRef.current;
      if (!button || !bounds) return;
      const rect = button.getBoundingClientRect();
      const boundsRect = bounds.getBoundingClientRect();
      if (
        event.clientX < boundsRect.left ||
        event.clientX > boundsRect.right ||
        event.clientY < boundsRect.top ||
        event.clientY > boundsRect.bottom
      ) {
        return;
      }
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
      if (distance < EVASIVE_CONFIG.dangerRadius) {
        moveButton();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [enabled, reducedMotion]);

  useEffect(() => {
    const handleResize = () => {
      const button = buttonRef.current;
      const bounds = boundsRef.current;
      if (!button || !bounds) return;
      const rect = button.getBoundingClientRect();
      const boundsRect = bounds.getBoundingClientRect();
      setPosition((prev) => ({
        x: clamp(
          prev.x,
          boundsRect.left + EVASIVE_CONFIG.padding,
          boundsRect.right - rect.width - EVASIVE_CONFIG.padding
        ),
        y: clamp(
          prev.y,
          boundsRect.top + EVASIVE_CONFIG.padding,
          boundsRect.bottom - rect.height - EVASIVE_CONFIG.padding
        )
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [buttonRef, boundsRef]);

  return { position, moveButton };
}

function QuizIntro({ onStart }: { onStart: () => void }) {
  return (
    <QuestionSlide
      label="Vedant's Valentine Quiz"
      title="Answer 3 questions to be Vedant’s Valentine 💘"
      subtitle="No pressure. Okay maybe a little."
      themeColor="#ff5ea8"
      stickers={[
        { name: "heart", style: { top: 20, left: 28, transform: "rotate(-6deg)" } },
        { name: "sparkles", className: "small", style: { bottom: 28, right: 36 } }
      ]}
      align="center"
    >
      <div className="buttonArea">
        <button className="primaryButton" onClick={onStart} type="button">
          Start Quiz
        </button>
      </div>
    </QuestionSlide>
  );
}

function QuizQuestion({
  question,
  index,
  total,
  onCorrect
}: {
  question: Question;
  index: number;
  total: number;
  onCorrect: () => void;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const handleAnswer = (choiceIndex: number) => {
    if (locked) return;
    if (choiceIndex === question.correctIndex) {
      setFeedback("Correct ✅");
      setLocked(true);
      window.setTimeout(() => {
        setFeedback(null);
        setLocked(false);
        onCorrect();
      }, 750);
    } else {
      setFeedback("Nope 😅 try again");
    }
  };

  const progress = ((index + 1) / total) * 100;

  return (
    <QuestionSlide
      label="Vedant's Valentine Quiz"
      title={question.prompt}
      themeColor={question.themeColor}
      stickers={question.stickers}
    >
      <div className="progressRow">
        <span>
          Question {index + 1} of {total}
        </span>
        <div className="progressBar" aria-hidden="true">
          <div className="progressFill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="answerGrid">
        {question.options.map((option, optionIndex) => (
          <button
            key={option}
            className="ghostButton answerButton"
            onClick={() => handleAnswer(optionIndex)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
      {feedback && <p className="feedback">{feedback}</p>}
    </QuestionSlide>
  );
}

function FinalChoice({
  onCelebrate,
  reducedMotion,
  stageRef
}: {
  onCelebrate: () => void;
  reducedMotion: boolean;
  stageRef: RefObject<HTMLDivElement>;
}) {
  const evasiveRef = useRef<HTMLButtonElement>(null);
  const acceptRef = useRef<HTMLButtonElement>(null);
  const acceptCardRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [overlayNode, setOverlayNode] = useState<HTMLElement | null>(null);
  const [placeholderSize, setPlaceholderSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    let node = document.getElementById("overlay-root") as HTMLDivElement | null;
    let created = false;
    if (!node) {
      node = document.createElement("div");
      node.id = "overlay-root";
      document.body.appendChild(node);
      created = true;
    }
    setOverlayNode(node);
    return () => {
      if (created && node?.parentNode) {
        node.parentNode.removeChild(node);
      }
    };
  }, []);

  useEffect(() => {
    if (!overlayNode) return;
    const button = evasiveRef.current;
    if (!button) return;
    const frame = requestAnimationFrame(() => {
      const rect = button.getBoundingClientRect();
      setPlaceholderSize({ width: rect.width, height: rect.height });
    });
    return () => cancelAnimationFrame(frame);
  }, [overlayNode]);

  const { position, moveButton } = useEvasivePosition({
    buttonRef: evasiveRef,
    avoidRef: acceptCardRef,
    anchorRef: placeholderRef,
    boundsRef: stageRef,
    enabled: true,
    reducedMotion,
    ready: Boolean(overlayNode)
  });

  return (
    <QuestionSlide
      label="Vedant's Valentine Quiz"
      title="How badly do you wanna be Vedant’s Valentine?"
      subtitle="Choose wisely. The universe is watching. ✨"
      mutedSubtitle="You’ll never be able to catch one of these options, lol."
      themeColor="#ff5ea8"
      stickers={[
        { name: "gift", style: { top: 24, right: 32, transform: "rotate(6deg)" } },
        { name: "sparkles", className: "small", style: { bottom: 24, left: 32 } }
      ]}
    >
      <div className="finalChoice">
        <div className="finalCard">
          <div
            ref={placeholderRef}
            className="placeholderSlot"
            style={
              placeholderSize
                ? { width: placeholderSize.width, height: placeholderSize.height }
                : undefined
            }
            aria-hidden="true"
          />
        </div>
        <div ref={acceptCardRef} className="finalCard">
          <button
            ref={acceptRef}
            className="primaryButton"
            onClick={onCelebrate}
            type="button"
          >
            I’m dying to be his Valentine
          </button>
        </div>
      </div>
      {overlayNode &&
        createPortal(
          <div className="overlayLayer">
            <button
              ref={evasiveRef}
              className="ghostButton evasiveButton"
              style={{
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                transitionDuration: `${EVASIVE_CONFIG.transitionDuration}ms`
              }}
              onMouseEnter={() => moveButton()}
              onTouchStart={(event) => {
                event.preventDefault();
                moveButton();
              }}
              aria-label="meh, I don't care"
              type="button"
            >
              meh, I don’t care
            </button>
          </div>,
          overlayNode
        )}
    </QuestionSlide>
  );
}

function Celebration({
  onReplay
}: {
  onReplay: () => void;
}) {
  return (
    <QuestionSlide
      label="Vedant's Valentine Quiz"
      title="YAY! 💖 You did it."
      subtitle="Welcome to Vedant’s Valentine era."
      themeColor="#ff6b9c"
      stickers={[
        { name: "cake", style: { top: 20, left: 28, transform: "rotate(-4deg)" } },
        { name: "heart", className: "small", style: { bottom: 22, right: 34 } }
      ]}
      align="center"
    >
      <HeartPhoto src="/valentine.jpeg" alt="A sweet valentine memory" />
      <button className="ghostButton replayButton" onClick={onReplay} type="button">
        Replay
      </button>
    </QuestionSlide>
  );
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const heartIdRef = useRef(0);
  const confettiCleanupRef = useRef<(() => void) | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (stage !== "celebrate") {
      confettiCleanupRef.current?.();
      confettiCleanupRef.current = null;
      return;
    }

    if (reducedMotion) return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    confettiCleanupRef.current = createConfetti(
      ctx,
      canvas.width,
      canvas.height,
      CONFETTI_CONFIG.count
    );
    return () => confettiCleanupRef.current?.();
  }, [reducedMotion, stage]);

  useEffect(() => {
    if (stage !== "celebrate") {
      setHearts([]);
      return;
    }

    const maxHearts = reducedMotion ? 6 : HEARTS_CONFIG.max;
    const spawnInterval = reducedMotion ? 450 : HEARTS_CONFIG.spawnInterval;
    const duration = reducedMotion ? 1600 : HEARTS_CONFIG.duration;
    const startTime = Date.now();
    const interval = window.setInterval(() => {
      if (Date.now() - startTime > 3600) {
        window.clearInterval(interval);
        return;
      }
      setHearts((prev) => {
        if (prev.length >= maxHearts) return prev;
        const id = heartIdRef.current++;
        const heart: Heart = {
          id,
          left: Math.random() * 90 + 5,
          size: Math.random() * 18 + 18,
          duration: duration + Math.random() * 600
        };
        window.setTimeout(() => {
          setHearts((current) => current.filter((item) => item.id !== id));
        }, heart.duration);
        return [...prev, heart];
      });
    }, spawnInterval);

    return () => window.clearInterval(interval);
  }, [reducedMotion, stage]);

  const handleCelebrate = () => {
    setStage("celebrate");
    if (soundEnabled) {
      playPop(audioContextRef);
    }
  };

  const handleReplay = () => {
    setStage("intro");
    setCurrentIndex(0);
  };

  return (
    <main className="stage">
      <SlideStage ref={stageRef}>
        <SlideFrame>
          <button
            className="soundToggle"
            onClick={() => setSoundEnabled((prev) => !prev)}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? "Mute sound effects" : "Unmute sound effects"}
            type="button"
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>

          {stage === "intro" && <QuizIntro onStart={() => setStage("quiz")} />}
          {stage === "quiz" && (
            <QuizQuestion
              question={QUIZ_QUESTIONS[currentIndex]}
              index={currentIndex}
              total={QUIZ_QUESTIONS.length}
              onCorrect={() => {
                if (currentIndex === QUIZ_QUESTIONS.length - 1) {
                  setStage("final");
                } else {
                  setCurrentIndex((prev) => prev + 1);
                }
              }}
            />
          )}
          {stage === "final" && (
            <FinalChoice
              onCelebrate={handleCelebrate}
              reducedMotion={reducedMotion}
              stageRef={stageRef}
            />
          )}
          {stage === "celebrate" && <Celebration onReplay={handleReplay} />}
        </SlideFrame>
      </SlideStage>

      {stage === "celebrate" && (
        <>
          <canvas ref={confettiCanvasRef} className="confettiCanvas" />
          <div className="heartsLayer" aria-hidden="true">
            {hearts.map((heart) => (
              <span
                key={heart.id}
                className="heart"
                style={{
                  left: `${heart.left}%`,
                  fontSize: `${heart.size}px`,
                  animationDuration: `${heart.duration}ms`
                }}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
