import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Project, AIAgent, Message, ProjectFile } from "../types";

export function useProject(projectId: number) {
  const queryClient = useQueryClient();

  const project = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    queryFn: () => api.projects.get(projectId).then(res => res.json()),
  });

  const agents = useQuery<AIAgent[]>({
    queryKey: ["/api/projects", projectId, "agents"],
    queryFn: () => api.agents.list(projectId).then(res => res.json()),
  });

  const messages = useQuery<Message[]>({
    queryKey: ["/api/projects", projectId, "messages"],
    queryFn: () => api.messages.list(projectId).then(res => res.json()),
  });

  const files = useQuery<ProjectFile[]>({
    queryKey: ["/api/projects", projectId, "files"],
    queryFn: () => api.files.list(projectId).then(res => res.json()),
  });

  const pauseProject = useMutation({
    mutationFn: () => api.projects.pause(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
  });

  const resumeProject = useMutation({
    mutationFn: () => api.projects.resume(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
    },
  });

  const updateAgent = useMutation({
    mutationFn: ({ agentId, data }: { agentId: number; data: Partial<AIAgent> }) =>
      api.agents.update(agentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "agents"] });
    },
  });

  const createFile = useMutation({
    mutationFn: (data: { path: string; content?: string; type: 'file' | 'folder' }) =>
      api.files.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
    },
  });

  const updateFile = useMutation({
    mutationFn: ({ fileId, content }: { fileId: number; content: string }) =>
      api.files.update(fileId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
    },
  });

  const deleteFile = useMutation({
    mutationFn: (fileId: number) => api.files.delete(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
    },
  });

  return {
    project,
    agents,
    messages,
    files,
    pauseProject,
    resumeProject,
    updateAgent,
    createFile,
    updateFile,
    deleteFile,
  };
}
