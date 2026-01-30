"use client";

import { useState, useRef, useEffect } from "react";
import { Booking, Project, Phase } from "./types";
import { mockProjects, getPhasesForProject } from "./data/mock";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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

  // Format: "2:30" or "2:15" (hours:minutes)
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const hours = parseInt(colonMatch[1], 10);
    const mins = parseInt(colonMatch[2], 10);
    if (mins >= 60) return null;
    return roundTo15(hours * 60 + mins);
  }

  // Format: "1.5h" or "2h" (hours)
  const hourMatch = trimmed.match(/^(\d*\.?\d+)\s*h$/);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    return roundTo15(hours * 60);
  }

  // Format: "30m" or "45m" (minutes)
  const minMatch = trimmed.match(/^(\d+)\s*m$/);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    return roundTo15(mins);
  }

  // Plain number: interpret as minutes
  const plainMatch = trimmed.match(/^(\d+)$/);
  if (plainMatch) {
    const mins = parseInt(plainMatch[1], 10);
    return roundTo15(mins);
  }

  // Decimal without unit: interpret as hours (e.g., "1.5" = 1.5h)
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

  // Get the first match for inline autocomplete
  const suggestion =
    query && filteredItems.length > 0 ? filteredItems[0] : null;
  const suggestionLabel = suggestion ? getLabel(suggestion) : "";

  // Check if suggestion starts with query (case-insensitive) for inline display
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

  // Sync query with selected value when value changes externally
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
        {/* Suggestion overlay */}
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

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [timeInput, setTimeInput] = useState("");
  const [description, setDescription] = useState("");

  const parsedDuration = parseTimeInput(timeInput);
  const isValidDuration = parsedDuration !== null && parsedDuration >= 15;

  const phases = selectedProject ? getPhasesForProject(selectedProject.id) : [];

  // Close form on Escape
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

  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

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
    getPhasesForProject(projectId).find((p) => p.id === phaseId)?.name ??
    "Unknown";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-2xl mx-auto mt-8">
        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousDay}
            className="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            Previous
          </button>
          <div className="text-center">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              {formatDisplayDate(selectedDate)}
            </h2>
            {formatDate(selectedDate) !== formatDate(new Date()) && (
              <button
                onClick={goToToday}
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Go to today
              </button>
            )}
          </div>
          <button
            onClick={goToNextDay}
            className="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            Next
          </button>
        </div>

        {/* Bookings List */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-4">
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
                        <span className="text-zinc-400 dark:text-zinc-500">
                          /
                        </span>
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
                      {/* Placeholder buttons for future edit/delete */}
                      <button
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        title="Edit (not implemented)"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        className="text-zinc-400 hover:text-red-500"
                        title="Delete (not implemented)"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add Booking Button / Form */}
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

            {/* Project Search */}
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

            {/* Phase Search */}
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

            {/* Description */}
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

            {/* Time Spent */}
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
                  <span
                    className={`text-sm whitespace-nowrap ${isValidDuration ? "text-zinc-600 dark:text-zinc-400" : "text-red-500"}`}
                  >
                    {isValidDuration
                      ? formatDuration(parsedDuration)
                      : "Min 15m"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                Formats: 30m, 1.5h, 2:30, or just minutes
              </p>
            </div>

            {/* Form Actions */}
            <button
              type="submit"
              disabled={!selectedProject || !selectedPhase || !isValidDuration}
              className="w-full py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Booking
            </button>

            {/* Close button - last in DOM for tab order, positioned top right */}
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
