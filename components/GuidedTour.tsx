"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Compass, MousePointer2 } from "lucide-react";
import {
  TOUR_STEPS,
  placeTourCard,
  rememberTour,
  type TourRect,
} from "../lib/tour";
import "./GuidedTour.css";

export default function GuidedTour({
  firstVisit,
  run,
}: {
  firstVisit: boolean;
  run: number;
}) {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<TourRect | null>(null);
  const [position, setPosition] = useState({ width: 380, left: 16, top: 16 });
  const card = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const offered = useRef(false);
  const previousRun = useRef(0);
  const current = TOUR_STEPS[index];

  useEffect(() => {
    const automatic = firstVisit && !offered.current;
    const requested = run > previousRun.current;
    offered.current = true;
    previousRun.current = run;
    if (!automatic && !requested) return;
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    rememberTour("offered");
    setIndex(0);
    setActive(true);
  }, [firstVisit, run]);

  function close(status: "skipped" | "completed") {
    rememberTour(status);
    setActive(false);
    const focus = returnFocus.current;
    if (focus?.isConnected && focus !== document.body)
      focus.focus({ preventScroll: true });
    else
      document
        .querySelector<HTMLButtonElement>(".help-button")
        ?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!active) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      close("skipped");
    };
    window.addEventListener("keydown", escape, true);
    return () => window.removeEventListener("keydown", escape, true);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const element = current.target
      ? document.querySelector<HTMLElement>(current.target)
      : null;
    let frame = 0;
    const measure = () => {
      const rect = element?.getBoundingClientRect();
      const box = rect
        ? {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }
        : null;
      setTarget(box);
      setPosition(
        placeTourCard(
          box,
          { width: window.innerWidth, height: window.innerHeight },
          card.current?.offsetHeight ?? 320,
        ),
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    heading.current?.focus({ preventScroll: true });
    if (element) {
      const rect = element.getBoundingClientRect();
      const available = Math.max(
        100,
        window.innerHeight - (card.current?.offsetHeight ?? 320) - 64,
      );
      window.scrollTo({
        top: Math.max(
          0,
          window.scrollY +
            rect.top -
            Math.max(24, (available - Math.min(rect.height, available)) / 2),
        ),
        behavior: "instant",
      });
    }
    measure();
    const observer = new ResizeObserver(schedule);
    if (element) observer.observe(element);
    if (card.current) observer.observe(card.current);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [active, index, current.target]);

  if (!active) return null;
  const spotlight =
    target && target.top + target.height > 0 && target.top < window.innerHeight
      ? {
          left: Math.max(8, target.left - 7),
          top: Math.max(8, target.top - 7),
          width: Math.min(window.innerWidth - 16, target.width + 14),
          height: Math.max(
            0,
            Math.min(window.innerHeight - 8, target.top + target.height + 7) -
              Math.max(8, target.top - 7),
          ),
        }
      : null;

  return createPortal(
    <div className="guided-tour">
      <div
        className={`tour-spotlight ${spotlight ? "" : "tour-no-target"}`}
        style={spotlight ?? undefined}
        aria-hidden="true"
      />
      <div
        ref={card}
        className="tour-card"
        style={position}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-body tour-tip"
      >
        <div className="tour-topline">
          <span>
            <Compass size={14} /> YOUR FIRST REHEARSAL
          </span>
          <button
            className="tour-skip"
            onClick={() => close("skipped")}
            aria-label="Skip tour"
          >
            Skip tour
          </button>
        </div>
        <div
          className="tour-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOUR_STEPS.length}
          aria-valuenow={index + 1}
          aria-label={`Step ${index + 1} of ${TOUR_STEPS.length}`}
        >
          {TOUR_STEPS.map((s, i) => (
            <i key={s.id} className={i <= index ? "visited" : ""} />
          ))}
        </div>
        <p className="tour-step-number">
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(TOUR_STEPS.length).padStart(2, "0")}
        </p>
        <h2 id="tour-title" tabIndex={-1} ref={heading}>
          {current.title}
        </h2>
        <p id="tour-body" className="tour-body">
          {current.body}
        </p>
        <p id="tour-tip" className="tour-tip">
          {current.tip}
        </p>
        {current.target && (
          <button
            className="tour-try"
            onClick={() => {
              const section = document.querySelector<HTMLElement>(
                current.target!,
              );
              const control = section?.matches("button, input")
                ? section
                : section?.querySelector<HTMLElement>(
                    "button:not(:disabled), input:not(:disabled)",
                  );
              control?.focus({ preventScroll: true });
            }}
          >
            <MousePointer2 size={13} /> Try this section{" "}
            <span>or keep going below</span>
          </button>
        )}
        <div className="tour-actions">
          <button
            className="tour-back"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            className="tour-next"
            onClick={() =>
              index === TOUR_STEPS.length - 1
                ? close("completed")
                : setIndex((i) => i + 1)
            }
          >
            {index === 0
              ? "Show me around"
              : index === TOUR_STEPS.length - 1
                ? "Start conducting"
                : "Next"}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
