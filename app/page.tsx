"use client";

import { useState } from "react";
import { Booking } from "./types";
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

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [projectId, setProjectId] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [timeType, setTimeType] = useState<"range" | "duration">("range");
  const [from, setFrom] = useState("09:00");
  const [until, setUntil] = useState("10:00");
  const [duration, setDuration] = useState(60);

  const phases = projectId ? getPhasesForProject(projectId) : [];
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
    setProjectId("");
    setPhaseId("");
    setTimeType("range");
    setFrom("09:00");
    setUntil("10:00");
    setDuration(60);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectId || !phaseId) return;

    const newBooking: Booking = {
      id: crypto.randomUUID(),
      date: dateStr,
      projectId,
      phaseId,
      timeType,
      ...(timeType === "range"
        ? { from, until }
        : { duration }),
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Time Booking
          </h1>
        </header>

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
                <li
                  key={booking.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {getProjectName(booking.projectId)}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {getPhaseName(booking.projectId, booking.phaseId)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-zinc-600 dark:text-zinc-300">
                      {booking.timeType === "range"
                        ? `${booking.from} - ${booking.until}`
                        : formatDuration(booking.duration!)}
                    </div>
                    {/* Placeholder buttons for future edit/delete */}
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
            className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4">
              New Booking
            </h3>

            {/* Project Select */}
            <div className="mb-4">
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setPhaseId("");
                }}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100"
                required
              >
                <option value="">Select project...</option>
                {mockProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Phase Select */}
            <div className="mb-4">
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Phase
              </label>
              <select
                value={phaseId}
                onChange={(e) => setPhaseId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
                required
                disabled={!projectId}
              >
                <option value="">Select phase...</option>
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Type Toggle */}
            <div className="mb-4">
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Time Entry
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTimeType("range")}
                  className={`flex-1 py-2 text-sm rounded border ${
                    timeType === "range"
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent"
                      : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  From / Until
                </button>
                <button
                  type="button"
                  onClick={() => setTimeType("duration")}
                  className={`flex-1 py-2 text-sm rounded border ${
                    timeType === "duration"
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent"
                      : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  Duration
                </button>
              </div>
            </div>

            {/* Time Inputs */}
            {timeType === "range" ? (
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    From
                  </label>
                  <input
                    type="time"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    Until
                  </label>
                  <input
                    type="time"
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={1}
                  step={15}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="flex-1 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded hover:bg-zinc-800 dark:hover:bg-zinc-200"
              >
                Add Booking
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
