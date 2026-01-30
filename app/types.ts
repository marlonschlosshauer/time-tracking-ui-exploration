export interface Project {
  id: string;
  name: string;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
}

export interface Booking {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  projectId: string;
  phaseId: string;
  // Either from/until or duration
  timeType: "range" | "duration";
  from?: string; // HH:mm
  until?: string; // HH:mm
  duration?: number; // minutes
}
