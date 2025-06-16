import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { aiCoordinator } from "./services/aiCoordinator";
import { fileManager } from "./services/fileManager";
import { projectManager } from "./services/projectManager";
import { insertMessageSchema, insertProjectSchema, insertAiAgentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map<WebSocket, { projectId?: number }>();

  // Pass WebSocket clients to AI Coordinator for broadcasting
  aiCoordinator.setWebSocketClients(clients);

  wss.on('connection', (ws) => {
    clients.set(ws, {});
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_project':
            clients.set(ws, { projectId: message.projectId });
            break;
            
          case 'send_message':
            if (clients.get(ws)?.projectId) {
              const projectId = clients.get(ws)!.projectId!;
              
              // Save user message first
              const userMessage = await storage.createMessage({
                projectId,
                agentId: null,
                content: message.content,
                type: "user",
                metadata: null,
              });
              
              // Broadcast user message immediately
              clients.forEach((clientData, client) => {
                if (clientData.projectId === projectId && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'new_message',
                    message: userMessage
                  }));
                }
              });
              
              // Process with AI Coordinator (now using local responses)
              try {
                await aiCoordinator.processUserMessage(projectId, message.content);
              } catch (error) {
                console.error('Error processing AI message:', error);
                // The AI Coordinator now handles all broadcasting internally
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Projects API
  app.get("/api/projects", async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get("/api/projects/:id", async (req, res) => {
    const project = await storage.getProject(parseInt(req.params.id));
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await projectManager.createProject(projectData);
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data", error });
    }
  });

  app.patch("/api/projects/:id/pause", async (req, res) => {
    try {
      const project = await projectManager.pauseProject(parseInt(req.params.id));
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Failed to pause project", error });
    }
  });

  app.patch("/api/projects/:id/resume", async (req, res) => {
    try {
      const project = await projectManager.resumeProject(parseInt(req.params.id));
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Failed to resume project", error });
    }
  });

  // AI Agents API
  app.get("/api/projects/:projectId/agents", async (req, res) => {
    const agents = await storage.getAiAgentsByProject(parseInt(req.params.projectId));
    res.json(agents);
  });

  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.updateAiAgent(parseInt(req.params.id), req.body);
      res.json(agent);
    } catch (error) {
      res.status(400).json({ message: "Failed to update agent", error });
    }
  });

  // Messages API
  app.get("/api/projects/:projectId/messages", async (req, res) => {
    const messages = await storage.getMessagesByProject(parseInt(req.params.projectId));
    res.json(messages);
  });

  // Files API
  app.get("/api/projects/:projectId/files", async (req, res) => {
    const files = await fileManager.getProjectFileTree(parseInt(req.params.projectId));
    res.json(files);
  });

  app.post("/api/projects/:projectId/files", async (req, res) => {
    try {
      const { path, content, type } = req.body;
      const projectId = parseInt(req.params.projectId);
      
      let file;
      if (type === "folder") {
        file = await fileManager.createFolder(projectId, path);
      } else {
        file = await fileManager.createFile(projectId, path, content);
      }
      
      res.json(file);
    } catch (error) {
      res.status(400).json({ message: "Failed to create file", error });
    }
  });

  app.patch("/api/files/:id", async (req, res) => {
    try {
      const { content } = req.body;
      const file = await fileManager.updateFile(parseInt(req.params.id), content);
      res.json(file);
    } catch (error) {
      res.status(400).json({ message: "Failed to update file", error });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      await fileManager.deleteFile(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete file", error });
    }
  });

  // Export/Import API
  app.get("/api/projects/:id/export", async (req, res) => {
    try {
      const zipBuffer = await fileManager.exportProject(parseInt(req.params.id));
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="project_${req.params.id}.zip"`);
      res.send(zipBuffer);
    } catch (error) {
      res.status(400).json({ message: "Failed to export project", error });
    }
  });

  return httpServer;
}
