"use client";

import { useState, useRef, useEffect, forwardRef, useCallback } from "react";
import { Booking, Project, Phase } from "./types";
import { mockProjects, getPhasesForProject } from "./data/mock";

// Field indices for arrow key navigation
const FIELD_PROJECT = 0;
const FIELD_PHASE = 1;
const FIELD_DESCRIPTION = 2;
const FIELD_TIME = 3;

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(startOfWeek: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return formatDate(date) === formatDate(today);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

const WORKDAY_MINUTES = 8 * 60;

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function roundTo15(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

function parseTimeInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const hours = parseInt(colonMatch[1], 10);
    const mins = parseInt(colonMatch[2], 10);
    if (mins >= 60) return null;
    return roundTo15(hours * 60 + mins);
  }

  const hourMatch = trimmed.match(/^(\d*\.?\d+)\s*h$/);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    return roundTo15(hours * 60);
  }

  const minMatch = trimmed.match(/^(\d+)\s*m$/);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    return roundTo15(mins);
  }

  const plainMatch = trimmed.match(/^(\d+)$/);
  if (plainMatch) {
    const mins = parseInt(plainMatch[1], 10);
    return roundTo15(mins);
  }

  const decimalMatch = trimmed.match(/^(\d*\.\d+)$/);
  if (decimalMatch) {
    const hours = parseFloat(decimalMatch[1]);
    return roundTo15(hours * 60);
  }

  return null;
}

function fuzzyMatch(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === lowerQuery.length;
}

interface SearchSelectProps<T> {
  items: T[];
  value: T | null;
  onChange: (item: T | null) => void;
  getLabel: (item: T) => string;
  placeholder: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onArrowNavigation?: (direction: "up" | "down") => void;
}

const SearchSelect = forwardRef(function SearchSelect<T extends { id: string }>(
  {
    items,
    value,
    onChange,
    getLabel,
    placeholder,
    disabled = false,
    autoFocus = false,
    onArrowNavigation,
  }: SearchSelectProps<T>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);

  // Combine external ref with internal ref
  const setInputRef = (node: HTMLInputElement | null) => {
    internalInputRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const filteredItems = query
    ? items.filter((item) => fuzzyMatch(getLabel(item), query))
    : items;

  const suggestion =
    query && filteredItems.length > 0 ? filteredItems[0] : null;
  const suggestionLabel = suggestion ? getLabel(suggestion) : "";

  const showInlineSuggestion =
    suggestion &&
    suggestionLabel.toLowerCase().startsWith(query.toLowerCase()) &&
    query.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      setQuery(getLabel(value));
    } else {
      setQuery("");
    }
  }, [value, getLabel]);

  const acceptSuggestion = () => {
    if (suggestion) {
      onChange(suggestion);
      setQuery(getLabel(suggestion));
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      if (suggestion && !value) {
        e.preventDefault();
        acceptSuggestion();
      }
    } else if ((e.key === "ArrowUp" || e.key === "ArrowDown") && onArrowNavigation && !isOpen) {
      e.preventDefault();
      onArrowNavigation(e.key === "ArrowUp" ? "up" : "down");
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {showInlineSuggestion && !value && (
          <div className="absolute inset-0 px-3 py-2 pointer-events-none flex items-center">
            <span className="invisible">{query}</span>
            <span className="text-zinc-400 dark:text-zinc-500">
              {suggestionLabel.slice(query.length)}
            </span>
          </div>
        )}
        <input
          ref={setInputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (value && e.target.value !== getLabel(value)) {
              onChange(null);
            }
          }}
          onClick={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="w-full px-2 py-1.5 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 disabled:opacity-50 focus:outline-none"
        />
      </div>
      {isOpen && filteredItems.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-auto bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded shadow-lg">
          {filteredItems.map((item, index) => (
            <li
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item);
                setQuery(getLabel(item));
                setIsOpen(false);
              }}
              className={`px-3 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 ${
                value?.id === item.id
                  ? "bg-zinc-100 dark:bg-zinc-700"
                  : index === 0 && query
                    ? "bg-zinc-100 dark:bg-zinc-700"
                    : ""
              }`}
            >
              {getLabel(item)}
            </li>
          ))}
        </ul>
      )}
      {isOpen && filteredItems.length === 0 && query && (
        <div className="absolute z-10 w-full mt-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded shadow-lg text-zinc-500 dark:text-zinc-400">
          No results found
        </div>
      )}
    </div>
  );
}) as <T extends { id: string }>(
  props: SearchSelectProps<T> & { ref?: React.Ref<HTMLInputElement> }
) => React.ReactElement;

// BookingRow component - handles both existing bookings and new booking row
interface BookingRowProps {
  booking: Booking | null; // null means "add new" row
  rowIndex: number;
  totalRows: number;
  onSave: (booking: Booking) => void;
  onDelete?: (id: string) => void;
  registerRef: (rowIndex: number, fieldIndex: number, el: HTMLInputElement | null) => void;
  focusField: (rowIndex: number, fieldIndex: number) => void;
}

function BookingRow({
  booking,
  rowIndex,
  totalRows,
  onSave,
  onDelete,
  registerRef,
  focusField,
}: BookingRowProps) {
  const isNewRow = booking === null;

  // Get initial values from booking or empty for new row
  const initialProject = booking
    ? mockProjects.find((p) => p.id === booking.projectId) ?? null
    : null;
  const initialPhase = booking
    ? getPhasesForProject(booking.projectId).find((p) => p.id === booking.phaseId) ?? null
    : null;
  const initialTime = booking ? formatDuration(booking.duration) : "";
  const initialDescription = booking?.description ?? "";

  const [selectedProject, setSelectedProject] = useState<Project | null>(initialProject);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(initialPhase);
  const [timeInput, setTimeInput] = useState(initialTime);
  const [description, setDescription] = useState(initialDescription);

  // Update local state when booking changes (e.g., date switch)
  useEffect(() => {
    if (booking) {
      const project = mockProjects.find((p) => p.id === booking.projectId) ?? null;
      const phase = getPhasesForProject(booking.projectId).find((p) => p.id === booking.phaseId) ?? null;
      setSelectedProject(project);
      setSelectedPhase(phase);
      setTimeInput(formatDuration(booking.duration));
      setDescription(booking.description);
    } else {
      setSelectedProject(null);
      setSelectedPhase(null);
      setTimeInput("");
      setDescription("");
    }
  }, [booking]);

  const phases = selectedProject ? getPhasesForProject(selectedProject.id) : [];
  const parsedDuration = parseTimeInput(timeInput);
  const isValidDuration = parsedDuration !== null && parsedDuration >= 15;

  const handleArrowNavigation = useCallback(
    (fieldIndex: number) => (direction: "up" | "down") => {
      const targetRow = direction === "up" ? rowIndex - 1 : rowIndex + 1;
      if (targetRow >= 0 && targetRow < totalRows) {
        focusField(targetRow, fieldIndex);
      }
    },
    [rowIndex, totalRows, focusField]
  );

  const handleTextInputKeyDown = (
    fieldIndex: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const input = e.currentTarget;
      const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
      const atEnd =
        input.selectionStart === input.value.length &&
        input.selectionEnd === input.value.length;

      // Only navigate if at start/end of text or if text is empty
      if (atStart || atEnd || input.value.length === 0) {
        e.preventDefault();
        handleArrowNavigation(fieldIndex)(e.key === "ArrowUp" ? "up" : "down");
      }
    }
  };

  const saveBooking = () => {
    if (!selectedProject || !selectedPhase || !isValidDuration) return;

    const updatedBooking: Booking = {
      id: booking?.id ?? crypto.randomUUID(),
      date: booking?.date ?? "", // Will be set by parent for new bookings
      projectId: selectedProject.id,
      phaseId: selectedPhase.id,
      duration: parsedDuration!,
      description,
    };

    onSave(updatedBooking);

    // Reset form if this was a new row
    if (isNewRow) {
      setSelectedProject(null);
      setSelectedPhase(null);
      setTimeInput("");
      setDescription("");
    }
  };

  const handleBlur = () => {
    // Auto-save on blur if we have valid data
    if (booking && selectedProject && selectedPhase && isValidDuration) {
      // Check if anything changed
      const projectChanged = selectedProject.id !== booking.projectId;
      const phaseChanged = selectedPhase.id !== booking.phaseId;
      const durationChanged = parsedDuration !== booking.duration;
      const descriptionChanged = description !== booking.description;

      if (projectChanged || phaseChanged || durationChanged || descriptionChanged) {
        saveBooking();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBooking();
  };

  const rowContent = (
    <>
      <div>
        <SearchSelect
          ref={(el) => registerRef(rowIndex, FIELD_PROJECT, el)}
          items={mockProjects}
          value={selectedProject}
          onChange={(project) => {
            setSelectedProject(project);
            setSelectedPhase(null);
          }}
          getLabel={(p) => p.name}
          placeholder="Project..."
          onArrowNavigation={handleArrowNavigation(FIELD_PROJECT)}
        />
      </div>
      <div>
        <SearchSelect
          ref={(el) => registerRef(rowIndex, FIELD_PHASE, el)}
          items={phases}
          value={selectedPhase}
          onChange={setSelectedPhase}
          getLabel={(p) => p.name}
          placeholder="Phase..."
          disabled={!selectedProject}
          onArrowNavigation={handleArrowNavigation(FIELD_PHASE)}
        />
      </div>
      <div>
        <input
          ref={(el) => registerRef(rowIndex, FIELD_DESCRIPTION, el)}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => handleTextInputKeyDown(FIELD_DESCRIPTION, e)}
          placeholder="Description..."
          className="w-full px-2 py-1.5 text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
        />
      </div>
      <div>
        <input
          ref={(el) => registerRef(rowIndex, FIELD_TIME, el)}
          type="text"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => handleTextInputKeyDown(FIELD_TIME, e)}
          placeholder="1h"
          className={`w-full px-2 py-1.5 text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none ${
            timeInput && !isValidDuration ? "text-red-500" : ""
          }`}
        />
      </div>
      <div className="flex justify-end">
        {isNewRow ? (
          <button
            type="submit"
            disabled={!selectedProject || !selectedPhase || !isValidDuration}
            className="p-1 text-zinc-400 hover:text-blue-500 disabled:opacity-30 disabled:hover:text-zinc-400"
            title="Add booking"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDelete?.(booking.id)}
            className="text-zinc-400 hover:text-red-500 p-1"
            title="Delete booking"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </>
  );

  if (isNewRow) {
    return (
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-[1fr_1fr_1.5fr_80px_40px] gap-2 px-4 py-3 items-center bg-zinc-50/50 dark:bg-zinc-800/30"
      >
        {rowContent}
      </form>
    );
  }

  return (
    <div
      className="grid grid-cols-[1fr_1fr_1.5fr_80px_40px] gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 items-center"
    >
      {rowContent}
    </div>
  );
}

// Generate mock bookings for demonstration
function generateMockBookings(): Booking[] {
  const today = new Date();
  const startOfWeek = getStartOfWeek(today);
  const bookings: Booking[] = [];

  const monday = new Date(startOfWeek);
  bookings.push(
    { id: "mock-1", date: formatDate(monday), projectId: "1", phaseId: "1-1", duration: 240, description: "Feature development" },
    { id: "mock-2", date: formatDate(monday), projectId: "1", phaseId: "1-2", duration: 120, description: "Design review meeting" },
    { id: "mock-3", date: formatDate(monday), projectId: "2", phaseId: "2-1", duration: 120, description: "Bug fixes" }
  );

  const tuesday = new Date(startOfWeek);
  tuesday.setDate(tuesday.getDate() + 1);
  bookings.push(
    { id: "mock-4", date: formatDate(tuesday), projectId: "3", phaseId: "3-1", duration: 180, description: "API integration" },
    { id: "mock-5", date: formatDate(tuesday), projectId: "1", phaseId: "1-3", duration: 180, description: "Testing" }
  );

  const wednesday = new Date(startOfWeek);
  wednesday.setDate(wednesday.getDate() + 2);
  bookings.push(
    { id: "mock-6", date: formatDate(wednesday), projectId: "4", phaseId: "4-1", duration: 300, description: "Feature work" },
    { id: "mock-7", date: formatDate(wednesday), projectId: "4", phaseId: "4-2", duration: 180, description: "Bug fixes" }
  );

  const thursday = new Date(startOfWeek);
  thursday.setDate(thursday.getDate() + 3);
  bookings.push(
    { id: "mock-8", date: formatDate(thursday), projectId: "5", phaseId: "5-1", duration: 120, description: "Design system work" }
  );

  return bookings;
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>(generateMockBookings);

  // Ref map for arrow key navigation: Map<`${rowIndex}-${fieldIndex}`, HTMLInputElement>
  const fieldRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const registerRef = useCallback(
    (rowIndex: number, fieldIndex: number, el: HTMLInputElement | null) => {
      const key = `${rowIndex}-${fieldIndex}`;
      if (el) {
        fieldRefs.current.set(key, el);
      } else {
        fieldRefs.current.delete(key);
      }
    },
    []
  );

  const focusField = useCallback((rowIndex: number, fieldIndex: number) => {
    const key = `${rowIndex}-${fieldIndex}`;
    const el = fieldRefs.current.get(key);
    if (el) {
      el.focus();
    }
  }, []);

  // Navigate to previous day, skipping weekends
  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    // Skip weekends going backwards
    while (isWeekend(prev)) {
      prev.setDate(prev.getDate() - 1);
    }
    setSelectedDate(prev);
  };

  // Navigate to next day, skipping weekends
  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    // Skip weekends going forwards
    while (isWeekend(next)) {
      next.setDate(next.getDate() + 1);
    }
    setSelectedDate(next);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if already handled by another handler
      if (e.defaultPrevented) return;

      const target = e.target as HTMLElement;
      const isInInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      const inputValue = isInInput ? (target as HTMLInputElement).value : "";
      const isEmptyInput = isInInput && inputValue === "";

      // Block non-arrow shortcuts when in an input with content
      if (isInInput && !isEmptyInput && e.key === "+") {
        return;
      }

      if (e.key === "+") {
        e.preventDefault();
        // Focus the project field in the "add new" row (last row)
        focusField(todaysBookings.length, FIELD_PROJECT);
      } else if (e.key === "ArrowDown" && (!isInInput || isEmptyInput)) {
        e.preventDefault();
        // Focus the first field of the first row
        focusField(0, FIELD_PROJECT);
      } else if (e.key === "ArrowUp" && (!isInInput || isEmptyInput)) {
        e.preventDefault();
        // Focus the last row (add new row)
        focusField(todaysBookings.length, FIELD_PROJECT);
      } else if (e.key === "ArrowLeft" && (!isInInput || isEmptyInput)) {
        e.preventDefault();
        goToPreviousDay();
      } else if (e.key === "ArrowRight" && (!isInInput || isEmptyInput)) {
        e.preventDefault();
        goToNextDay();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedDate]);

  const dateStr = formatDate(selectedDate);
  const todaysBookings = bookings.filter((b) => b.date === dateStr);
  const totalRows = todaysBookings.length + 1; // +1 for the "add new" row

  const startOfWeek = getStartOfWeek(selectedDate);
  const weekDays = getWeekDays(startOfWeek);

  const getHoursForDate = (date: Date): number => {
    const dateStr = formatDate(date);
    return bookings
      .filter((b) => b.date === dateStr)
      .reduce((sum, b) => sum + b.duration, 0);
  };

  const goToPreviousWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    setSelectedDate(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const weekTotal = weekDays.reduce((sum, day) => sum + getHoursForDate(day), 0);
  const currentWeekContainsToday = weekDays.some((day) => isToday(day));

  const handleSaveBooking = useCallback(
    (booking: Booking) => {
      setBookings((prev) => {
        const existingIndex = prev.findIndex((b) => b.id === booking.id);
        if (existingIndex >= 0) {
          // Update existing booking
          const updated = [...prev];
          updated[existingIndex] = { ...booking, date: prev[existingIndex].date };
          return updated;
        } else {
          // Add new booking with current date
          return [...prev, { ...booking, date: dateStr }];
        }
      });
    },
    [dateStr]
  );

  const handleDeleteBooking = useCallback((id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto mt-8">
        {/* Week Navigation */}
        <div className="mb-8">
          {/* Week header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousWeek}
              className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              &larr; Previous
            </button>
            <div className="text-center">
              <div className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {startOfWeek.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                {" - "}
                {weekDays[6].toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Total: {formatDuration(weekTotal)}
                {!currentWeekContainsToday && (
                  <button
                    onClick={goToToday}
                    className="ml-3 text-zinc-600 dark:text-zinc-300 hover:underline"
                  >
                    Go to today
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={goToNextWeek}
              className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              Next &rarr;
            </button>
          </div>

          {/* Week days */}
          <div className="flex gap-3">
            {weekDays.map((day) => {
              const dayStr = formatDate(day);
              const isSelected = dayStr === dateStr;
              const hours = getHoursForDate(day);
              const isMissingTime = !isWeekend(day) && hours < WORKDAY_MINUTES;
              const isComplete = hours >= WORKDAY_MINUTES;
              const dayIsToday = isToday(day);
              const weekend = isWeekend(day);

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDate(day)}
                  style={{ padding: "1.5rem 0.5rem", borderRadius: "1rem", position: "relative" as const }}
                  className={[
                    "relative flex-1 text-center transition-colors border-2",
                    isSelected && "bg-blue-600/80 dark:bg-blue-500/20 text-white border-blue-600/80 dark:border-blue-500/40",
                    !isSelected && weekend && "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700",
                    !isSelected && !weekend && isComplete && "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800",
                    !isSelected && !weekend && !isComplete && "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800",
                    dayIsToday && !isSelected && "ring-1 ring-zinc-400 dark:ring-zinc-500",
                  ].filter(Boolean).join(" ")}
                >
                                                      <div className={[
                    "text-xs font-medium uppercase tracking-wide mb-1",
                    isSelected && "text-blue-200",
                    !isSelected && weekend && "text-zinc-400 dark:text-zinc-500",
                    !isSelected && !weekend && "text-zinc-500 dark:text-zinc-400",
                  ].filter(Boolean).join(" ")}>
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-2xl font-bold">
                    {day.getDate()}
                  </div>
                  <div className={[
                    "text-sm mt-1 font-medium",
                    isSelected && "text-blue-200",
                    !isSelected && !weekend && isMissingTime && "text-blue-500 dark:text-blue-400",
                    !isSelected && !weekend && isComplete && "text-zinc-400 dark:text-zinc-600",
                    !isSelected && weekend && "text-zinc-400 dark:text-zinc-600",
                  ].filter(Boolean).join(" ")}>
                    {hours > 0 ? formatDuration(hours) : weekend ? "-" : "0h"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1.5fr_80px_40px] gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            <div>Project</div>
            <div>Phase</div>
            <div>Description</div>
            <div>Time</div>
            <div></div>
          </div>

          {/* Existing bookings */}
          {todaysBookings.map((booking, index) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              rowIndex={index}
              totalRows={totalRows}
              onSave={handleSaveBooking}
              onDelete={handleDeleteBooking}
              registerRef={registerRef}
              focusField={focusField}
            />
          ))}

          {/* Add new booking row */}
          <BookingRow
            booking={null}
            rowIndex={todaysBookings.length}
            totalRows={totalRows}
            onSave={handleSaveBooking}
            registerRef={registerRef}
            focusField={focusField}
          />
        </div>
      </div>
    </div>
  );
}
