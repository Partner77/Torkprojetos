import { storage } from "../storage";
import { type ProjectFile, type InsertProjectFile } from "@shared/schema";
import * as fs from "fs/promises";
import * as path from "path";
import { createReadStream, createWriteStream } from "fs";
import archiver from "archiver";

export class FileManager {
  async getProjectFileTree(projectId: number): Promise<ProjectFile[]> {
    return await storage.getProjectFilesByProject(projectId);
  }

  async createFile(projectId: number, filePath: string, content: string = ""): Promise<ProjectFile> {
    const pathParts = filePath.split("/");
    const fileName = pathParts[pathParts.length - 1];
    
    const fileData: InsertProjectFile = {
      projectId,
      path: filePath,
      name: fileName,
      content,
      type: "file",
      size: content.length,
    };
    
    return await storage.createProjectFile(fileData);
  }

  async createFolder(projectId: number, folderPath: string): Promise<ProjectFile> {
    const pathParts = folderPath.split("/");
    const folderName = pathParts[pathParts.length - 1];
    
    const folderData: InsertProjectFile = {
      projectId,
      path: folderPath,
      name: folderName,
      content: null,
      type: "folder",
      size: 0,
    };
    
    return await storage.createProjectFile(folderData);
  }

  async updateFile(fileId: number, content: string): Promise<ProjectFile> {
    return await storage.updateProjectFile(fileId, {
      content,
      size: content.length,
    });
  }

  async deleteFile(fileId: number): Promise<void> {
    await storage.deleteProjectFile(fileId);
  }

  async exportProject(projectId: number): Promise<Buffer> {
    const files = await this.getProjectFileTree(projectId);
    const project = await storage.getProject(projectId);
    
    if (!project) {
      throw new Error("Project not found");
    }

    // Create a temporary directory for the export
    const tempDir = path.join(process.cwd(), "temp", `project_${projectId}_${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // Write all files to temp directory
      for (const file of files) {
        if (file.type === "file" && file.content) {
          const filePath = path.join(tempDir, file.path);
          const dir = path.dirname(filePath);
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(filePath, file.content, "utf-8");
        }
      }

      // Create project state file
      const projectState = {
        project,
        files,
        agents: await storage.getAiAgentsByProject(projectId),
        messages: await storage.getMessagesByProject(projectId),
        exportedAt: new Date().toISOString(),
      };
      
      await fs.writeFile(
        path.join(tempDir, "project_state.json"),
        JSON.stringify(projectState, null, 2),
        "utf-8"
      );

      // Create ZIP archive
      return new Promise((resolve, reject) => {
        const archive = archiver("zip", { zlib: { level: 9 } });
        const chunks: Buffer[] = [];

        archive.on("data", (chunk) => chunks.push(chunk));
        archive.on("end", () => resolve(Buffer.concat(chunks)));
        archive.on("error", reject);

        archive.directory(tempDir, false);
        archive.finalize();
      });
    } finally {
      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }

  async importProject(zipBuffer: Buffer): Promise<number> {
    // This would extract the ZIP and recreate the project
    // For now, return a mock project ID
    const projectData: InsertProjectFile = {
      projectId: 1, // This would be dynamically created
      path: "/imported",
      name: "imported",
      content: null,
      type: "folder",
      size: 0,
    };
    
    const project = await storage.createProjectFile(projectData);
    return project.projectId!;
  }

  async initializeDefaultProjectStructure(projectId: number): Promise<void> {
    // Check if already initialized
    const existingFiles = await this.getProjectFileTree(projectId);
    if (existingFiles.length > 0) return;

    const defaultStructure = [
      // Estrutura de pastas completa
      { path: "client", type: "folder" },
      { path: "client/src", type: "folder" },
      { path: "client/src/components", type: "folder" },
      { path: "client/src/components/ui", type: "folder" },
      { path: "client/src/pages", type: "folder" },
      { path: "client/src/hooks", type: "folder" },
      { path: "client/src/lib", type: "folder" },
      { path: "server", type: "folder" },
      { path: "server/services", type: "folder" },
      { path: "shared", type: "folder" },
      { path: "docs", type: "folder" },
      { path: "public", type: "folder" },
      { path: "assets", type: "folder" },
      
      // Real project files
      { path: "client/src/App.tsx", type: "file", content: `import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="dark">
        <Dashboard />
      </div>
    </QueryClientProvider>
  );
}

export default App;` },
      
      { path: "client/src/pages/Dashboard.tsx", type: "file", content: `import { useState } from "react";
import { useProject } from "../hooks/useProject";
import { useWebSocket } from "../hooks/useWebSocket";

export default function Dashboard() {
  const projectId = 1;
  const { project, agents, messages } = useProject(projectId);
  const { sendMessage } = useWebSocket(projectId);

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">Sistema de Coordenação de IAs</h1>
        <div className="space-y-4">
          {messages.data?.map(msg => (
            <div key={msg.id} className="p-3 bg-card rounded-lg">
              <strong>{msg.type === 'user' ? 'Você' : 'IA'}:</strong>
              <p>{msg.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}` },
      
      { path: "server/index.ts", type: "file", content: `import express from "express";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());

async function main() {
  const server = await registerRoutes(app);
  const port = 5000;
  
  server.listen(port, "0.0.0.0", () => {
    console.log(\`Server running on port \${port}\`);
  });
}

main();` },
      
      { path: "shared/schema.ts", type: "file", content: `export interface AIAgent {
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
}` },
      
      { path: "package.json", type: "file", content: JSON.stringify({
        name: "sistema-coordenacao-ias",
        version: "1.0.0",
        description: "Sistema web colaborativo para coordenação de 5 IAs especialistas",
        main: "server/index.ts",
        scripts: {
          dev: "tsx server/index.ts",
          build: "tsc && vite build",
          start: "node dist/server/index.js"
        },
        dependencies: {
          "express": "^4.18.2",
          "ws": "^8.14.2",
          "openai": "^4.20.1",
          "react": "^18.2.0",
          "typescript": "^5.2.2"
        }
      }, null, 2) },
      
      { path: "project_state.json", type: "file", content: JSON.stringify({
        version: "1.0",
        projectName: project?.name || "Sistema de Coordenação de IAs",
        initialized: true,
        agents: {
          architeta: { active: true, tasks: ["coordenacao", "planejamento"] },
          frontend: { active: true, tasks: ["interface", "componentes"] },
          backend: { active: true, tasks: ["apis", "logica"] },
          qa: { active: true, tasks: ["testes", "qualidade"] },
          devops: { active: true, tasks: ["documentacao", "deploy"] }
        },
        lastUpdate: new Date().toISOString()
      }, null, 2) },
      
      { path: "README.md", type: "file", content: `# Sistema de Coordenação de IAs

Sistema web colaborativo que coordena 5 IAs especialistas trabalhando em projetos únicos.

## Funcionalidades

- **IA Arquiteta**: Coordena a equipe e gerencia projetos
- **IA Front-End**: Desenvolve interfaces e componentes React
- **IA Back-End**: Cria APIs e lógica de servidor
- **IA QA**: Realiza testes e validação de qualidade
- **IA DevOps**: Gerencia documentação e deploy

## Como usar

1. Inicie o servidor: \`npm run dev\`
2. Acesse a interface web
3. Converse com as IAs através do chat
4. Configure regras específicas para cada IA
5. Acompanhe o progresso das tarefas

## Arquitetura

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + WebSocket
- **IA**: OpenAI GPT-4o
- **Dados**: Sistema de storage em memória

Criado em ${new Date().toLocaleDateString('pt-BR')}` },
    ];

    for (const item of defaultStructure) {
      const fileData: InsertProjectFile = {
        projectId,
        path: item.path,
        name: item.path.split("/").pop() || item.path,
        content: item.type === "file" ? item.content : null,
        type: item.type as "file" | "folder",
        size: item.type === "file" ? (item.content?.length || 0) : 0,
      };
      
      await storage.createProjectFile(fileData);
    }
  }
}

export const fileManager = new FileManager();
