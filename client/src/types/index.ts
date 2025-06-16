export interface AIAgent {
  id: number;
  name: string;
  type: 'architeta' | 'frontend' | 'backend' | 'qa' | 'devops';
  status: 'available' | 'working' | 'waiting' | 'error';
  projectId: number;
  context: string | null;
  rules: any;
  config: any;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'paused' | 'completed';
  tokensUsed: number;
  tokensRemaining: number;
  createdAt: Date;
  updatedAt: Date;
  state: any;
}

export interface Message {
  id: number;
  projectId: number;
  agentId: number | null;
  content: string;
  type: 'user' | 'system' | 'ai_response' | 'progress_report';
  metadata: any;
  createdAt: Date;
}

export interface ProjectFile {
  id: number;
  projectId: number;
  path: string;
  name: string;
  content: string | null;
  type: 'file' | 'folder';
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
