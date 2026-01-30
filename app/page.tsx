"use client";

import { useState, useRef, useEffect } from "react";
import { Booking, Project, Phase } from "./types";
import { mockProjects, getPhasesForProject } from "./data/mock";

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
}

function SearchSelect<T extends { id: string }>({
  items,
  value,
  onChange,
  getLabel,
  placeholder,
  disabled = false,
  autoFocus = false,
}: SearchSelectProps<T>) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative bg-white dark:bg-zinc-800 rounded">
        {showInlineSuggestion && !value && (
          <div className="absolute inset-0 px-3 py-2 pointer-events-none flex items-center">
            <span className="invisible">{query}</span>
            <span className="text-zinc-400 dark:text-zinc-500">
              {suggestionLabel.slice(query.length)}
            </span>
          </div>
        )}
        <input
          ref={inputRef}
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
          className="w-full px-3 py-2 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 disabled:opacity-50 relative"
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
  const [showForm, setShowForm] = useState(false);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [timeInput, setTimeInput] = useState("");
  const [description, setDescription] = useState("");

  const parsedDuration = parseTimeInput(timeInput);
  const isValidDuration = parsedDuration !== null && parsedDuration >= 15;

  const phases = selectedProject ? getPhasesForProject(selectedProject.id) : [];

  useEffect(() => {
    if (!showForm) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        resetForm();
        setShowForm(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showForm]);

  const dateStr = formatDate(selectedDate);
  const todaysBookings = bookings.filter((b) => b.date === dateStr);

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

  const resetForm = () => {
    setSelectedProject(null);
    setSelectedPhase(null);
    setTimeInput("");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProject || !selectedPhase || !isValidDuration) return;

    const newBooking: Booking = {
      id: crypto.randomUUID(),
      date: dateStr,
      projectId: selectedProject.id,
      phaseId: selectedPhase.id,
      duration: parsedDuration!,
      description,
    };

    setBookings([...bookings, newBooking]);
    resetForm();
    setShowForm(false);
  };

  const getProjectName = (id: string) =>
    mockProjects.find((p) => p.id === id)?.name ?? "Unknown";

  const getPhaseName = (projectId: string, phaseId: string) =>
    getPhasesForProject(projectId).find((p) => p.id === phaseId)?.name ?? "Unknown";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-2xl mx-auto mt-8">
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

        {/* Add Booking Button / Form */}
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              + Add Booking
            </button>
          ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 relative"
          >
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4 pr-8">
              New Booking
            </h3>

            <div className="mb-4">
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Project <span className="text-red-500">*</span>
              </label>
              <SearchSelect
                items={mockProjects}
                value={selectedProject}
                onChange={(project) => {
                  setSelectedProject(project);
                  setSelectedPhase(null);
                }}
                getLabel={(p) => p.name}
                placeholder="Search projects..."
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Phase <span className="text-red-500">*</span>
              </label>
              <SearchSelect
                items={phases}
                value={selectedPhase}
                onChange={setSelectedPhase}
                getLabel={(p) => p.name}
                placeholder="Search phases..."
                disabled={!selectedProject}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Time spent <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  placeholder="e.g. 30m, 1.5h, 2:30"
                  className={`flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border rounded text-zinc-900 dark:text-zinc-100 ${
                    timeInput && !isValidDuration
                      ? "border-red-500"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                />
                {parsedDuration !== null && (
                  <span className={`text-sm whitespace-nowrap ${isValidDuration ? "text-zinc-600 dark:text-zinc-400" : "text-red-500"}`}>
                    {isValidDuration ? formatDuration(parsedDuration) : "Min 15m"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Formats: 30m, 1.5h, 2:30, or just minutes
              </p>
            </div>

            <button
              type="submit"
              disabled={!selectedProject || !selectedPhase || !isValidDuration}
              className="w-full py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Booking
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </form>
          )}
        </div>

        {/* Bookings List */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {todaysBookings.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              No bookings for this day
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {todaysBookings.map((booking) => (
                <li key={booking.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {getProjectName(booking.projectId)}
                        </span>
                        <span className="text-zinc-400 dark:text-zinc-500">/</span>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {getPhaseName(booking.projectId, booking.phaseId)}
                        </span>
                      </div>
                      {booking.description && (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 truncate">
                          {booking.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {formatDuration(booking.duration)}
                      </div>
                      <button
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        title="Edit (not implemented)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        className="text-zinc-400 hover:text-red-500"
                        title="Delete (not implemented)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
