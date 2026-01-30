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
  duration: number; // minutes
  description: string;
}
