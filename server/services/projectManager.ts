import { storage } from "../storage";
import { type Project, type InsertProject, type AiAgent } from "@shared/schema";
import { fileManager } from "./fileManager";

export class ProjectManager {
  async createProject(projectData: InsertProject): Promise<Project> {
    const project = await storage.createProject(projectData);
    
    // Initialize default AI agents for the project
    await this.initializeDefaultAgents(project.id);
    
    // Initialize default file structure
    await fileManager.initializeDefaultProjectStructure(project.id);
    
    return project;
  }

  async pauseProject(projectId: number): Promise<Project> {
    const project = await storage.getProject(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Save current state
    const currentState = await this.captureProjectState(projectId);
    
    return await storage.updateProject(projectId, {
      status: "paused",
      state: currentState,
    });
  }

  async resumeProject(projectId: number): Promise<Project> {
    const project = await storage.getProject(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.state) {
      // Restore project state
      await this.restoreProjectState(projectId, project.state);
    }

    return await storage.updateProject(projectId, {
      status: "active",
    });
  }

  async captureProjectState(projectId: number): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      agents: await storage.getAiAgentsByProject(projectId),
      messages: await storage.getMessagesByProject(projectId),
      files: await storage.getProjectFilesByProject(projectId),
      context: "Project state captured for continuation",
    };
  }

  async restoreProjectState(projectId: number, state: any): Promise<void> {
    // This would restore the complete project state
    // Including AI contexts, conversation history, etc.
    console.log(`Restoring project ${projectId} from state at ${state.timestamp}`);
  }

  async updateTokenUsage(projectId: number, tokensUsed: number): Promise<Project> {
    const project = await storage.getProject(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const newTokensUsed = project.tokensUsed + tokensUsed;
    const newTokensRemaining = Math.max(0, project.tokensRemaining - tokensUsed);

    return await storage.updateProject(projectId, {
      tokensUsed: newTokensUsed,
      tokensRemaining: newTokensRemaining,
    });
  }

  private async initializeDefaultAgents(projectId: number): Promise<void> {
    const defaultAgents = [
      {
        name: "IA Arquiteta",
        type: "architeta",
        context: "Você é a IA Arquiteta responsável por coordenar uma equipe de 4 outras IAs especialistas. Seu foco deve ser na organização, planejamento e comunicação clara dos objetivos.",
        rules: { reportProgress: true, validateWithQA: true, usePortuguese: true },
        config: { temperature: 0.7, maxTokens: 4096 }
      },
      {
        name: "IA Front-End",
        type: "frontend",
        context: "Você é especialista em desenvolvimento de interfaces de usuário usando React, TypeScript e Tailwind CSS. Sempre siga o guia de estilo fornecido.",
        rules: { followStyleGuide: true, useReact: true, useTailwind: true },
        config: { temperature: 0.6, maxTokens: 3000 }
      },
      {
        name: "IA Back-End",
        type: "backend",
        context: "Você é especialista em desenvolvimento de APIs e lógica de servidor usando Node.js, Express e bancos de dados.",
        rules: { useNodeJS: true, followRESTPatterns: true, validateInputs: true },
        config: { temperature: 0.5, maxTokens: 3000 }
      },
      {
        name: "IA QA",
        type: "qa",
        context: "Você é especialista em qualidade de software, testes automatizados e validação de código. Sempre revise o código antes de aprovar.",
        rules: { reviewAllCode: true, suggestTests: true, checkBugs: true },
        config: { temperature: 0.3, maxTokens: 2000 }
      },
      {
        name: "IA DevOps",
        type: "devops",
        context: "Você é especialista em documentação, deploy e organização de projetos. Mantenha sempre a documentação atualizada.",
        rules: { maintainDocs: true, organizeFiles: true, createREADME: true },
        config: { temperature: 0.4, maxTokens: 2000 }
      }
    ];

    for (const agentData of defaultAgents) {
      const agent = {
        ...agentData,
        projectId,
        status: "available" as const,
        tasksCompleted: 0,
        tasksTotal: 10,
      };
      
      await storage.createAiAgent(agent);
    }
  }
}

export const projectManager = new ProjectManager();
