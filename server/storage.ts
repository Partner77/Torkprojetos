import { 
  users, projects, aiAgents, messages, projectFiles,
  type User, type InsertUser,
  type Project, type InsertProject,
  type AiAgent, type InsertAiAgent,
  type Message, type InsertMessage,
  type ProjectFile, type InsertProjectFile
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // AI Agents
  getAiAgent(id: number): Promise<AiAgent | undefined>;
  getAiAgentsByProject(projectId: number): Promise<AiAgent[]>;
  createAiAgent(agent: InsertAiAgent): Promise<AiAgent>;
  updateAiAgent(id: number, updates: Partial<AiAgent>): Promise<AiAgent>;

  // Messages
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByProject(projectId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Project Files
  getProjectFile(id: number): Promise<ProjectFile | undefined>;
  getProjectFilesByProject(projectId: number): Promise<ProjectFile[]>;
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  updateProjectFile(id: number, updates: Partial<ProjectFile>): Promise<ProjectFile>;
  deleteProjectFile(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private aiAgents: Map<number, AiAgent>;
  private messages: Map<number, Message>;
  private projectFiles: Map<number, ProjectFile>;
  private currentUserId: number;
  private currentProjectId: number;
  private currentAiAgentId: number;
  private currentMessageId: number;
  private currentProjectFileId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.aiAgents = new Map();
    this.messages = new Map();
    this.projectFiles = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentAiAgentId = 1;
    this.currentMessageId = 1;
    this.currentProjectFileId = 1;

    // Initialize with default AI agents structure
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default project
    const defaultProject: Project = {
      id: this.currentProjectId++,
      name: "Sistema Web Colaborativo",
      description: "Sistema de coordenação de 5 IAs especialistas",
      status: "active",
      tokensUsed: 0,
      tokensRemaining: 4000,
      createdAt: new Date(),
      updatedAt: new Date(),
      state: null,
    };
    this.projects.set(defaultProject.id, defaultProject);

    // Create default AI agents
    const agentTypes = [
      { name: "IA Arquiteta", type: "architeta", context: "Você é a IA Arquiteta responsável por coordenar uma equipe de 4 outras IAs especialistas. Seu foco deve ser na organização, planejamento e comunicação clara dos objetivos." },
      { name: "IA Front-End", type: "frontend", context: "Você é especialista em desenvolvimento de interfaces de usuário usando React, TypeScript e Tailwind CSS." },
      { name: "IA Back-End", type: "backend", context: "Você é especialista em desenvolvimento de APIs e lógica de servidor usando Node.js, Express e bancos de dados." },
      { name: "IA QA", type: "qa", context: "Você é especialista em qualidade de software, testes automatizados e validação de código." },
      { name: "IA DevOps", type: "devops", context: "Você é especialista em documentação, deploy e organização de projetos." }
    ];

    agentTypes.forEach((agent, index) => {
      const aiAgent: AiAgent = {
        id: this.currentAiAgentId++,
        name: agent.name,
        type: agent.type,
        status: index === 0 ? "working" : "available",
        projectId: defaultProject.id,
        context: agent.context,
        rules: { reportProgress: true, validateWithQA: true },
        config: { temperature: 0.7, maxTokens: 4096 },
        tasksCompleted: Math.floor(Math.random() * 10),
        tasksTotal: 10 + Math.floor(Math.random() * 5),
      };
      this.aiAgents.set(aiAgent.id, aiAgent);
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = { 
      ...insertProject, 
      id,
      description: insertProject.description || null,
      status: insertProject.status || "active",
      tokensUsed: insertProject.tokensUsed || 0,
      tokensRemaining: insertProject.tokensRemaining || 4000,
      createdAt: new Date(),
      updatedAt: new Date(),
      state: insertProject.state || null
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error("Project not found");
    
    const updatedProject = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    this.projects.delete(id);
  }

  // AI Agents
  async getAiAgent(id: number): Promise<AiAgent | undefined> {
    return this.aiAgents.get(id);
  }

  async getAiAgentsByProject(projectId: number): Promise<AiAgent[]> {
    return Array.from(this.aiAgents.values()).filter(agent => agent.projectId === projectId);
  }

  async createAiAgent(insertAgent: InsertAiAgent): Promise<AiAgent> {
    const id = this.currentAiAgentId++;
    const agent: AiAgent = { 
      ...insertAgent, 
      id,
      projectId: insertAgent.projectId || null,
      status: insertAgent.status || "available",
      context: insertAgent.context || null,
      rules: insertAgent.rules || {},
      config: insertAgent.config || {},
      tasksCompleted: insertAgent.tasksCompleted || 0,
      tasksTotal: insertAgent.tasksTotal || 10
    };
    this.aiAgents.set(id, agent);
    return agent;
  }

  async updateAiAgent(id: number, updates: Partial<AiAgent>): Promise<AiAgent> {
    const agent = this.aiAgents.get(id);
    if (!agent) throw new Error("AI Agent not found");
    
    const updatedAgent = { ...agent, ...updates };
    this.aiAgents.set(id, updatedAgent);
    return updatedAgent;
  }

  // Messages
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByProject(projectId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.projectId === projectId)
      .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id,
      projectId: insertMessage.projectId || null,
      agentId: insertMessage.agentId || null,
      metadata: insertMessage.metadata || null,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  // Project Files
  async getProjectFile(id: number): Promise<ProjectFile | undefined> {
    return this.projectFiles.get(id);
  }

  async getProjectFilesByProject(projectId: number): Promise<ProjectFile[]> {
    return Array.from(this.projectFiles.values()).filter(file => file.projectId === projectId);
  }

  async createProjectFile(insertFile: InsertProjectFile): Promise<ProjectFile> {
    const id = this.currentProjectFileId++;
    const file: ProjectFile = { 
      ...insertFile, 
      id,
      projectId: insertFile.projectId || null,
      content: insertFile.content || null,
      size: insertFile.size || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projectFiles.set(id, file);
    return file;
  }

  async updateProjectFile(id: number, updates: Partial<ProjectFile>): Promise<ProjectFile> {
    const file = this.projectFiles.get(id);
    if (!file) throw new Error("Project file not found");
    
    const updatedFile = { ...file, ...updates, updatedAt: new Date() };
    this.projectFiles.set(id, updatedFile);
    return updatedFile;
  }

  async deleteProjectFile(id: number): Promise<void> {
    this.projectFiles.delete(id);
  }
}

export const storage = new MemStorage();
