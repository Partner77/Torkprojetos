import { apiRequest } from "./queryClient";
import type { Project, AIAgent, Message, ProjectFile } from "../types";

export const api = {
  // Projects
  projects: {
    list: () => apiRequest("GET", "/api/projects"),
    get: (id: number) => apiRequest("GET", `/api/projects/${id}`),
    create: (data: Partial<Project>) => apiRequest("POST", "/api/projects", data),
    pause: (id: number) => apiRequest("PATCH", `/api/projects/${id}/pause`),
    resume: (id: number) => apiRequest("PATCH", `/api/projects/${id}/resume`),
    export: (id: number) => apiRequest("GET", `/api/projects/${id}/export`),
  },

  // AI Agents
  agents: {
    list: (projectId: number) => apiRequest("GET", `/api/projects/${projectId}/agents`),
    update: (id: number, data: Partial<AIAgent>) => apiRequest("PATCH", `/api/agents/${id}`, data),
  },

  // Messages
  messages: {
    list: (projectId: number) => apiRequest("GET", `/api/projects/${projectId}/messages`),
  },

  // Files
  files: {
    list: (projectId: number) => apiRequest("GET", `/api/projects/${projectId}/files`),
    create: (projectId: number, data: { path: string; content?: string; type: 'file' | 'folder' }) => 
      apiRequest("POST", `/api/projects/${projectId}/files`, data),
    update: (id: number, data: { content: string }) => apiRequest("PATCH", `/api/files/${id}`, data),
    delete: (id: number) => apiRequest("DELETE", `/api/files/${id}`),
  },
};
