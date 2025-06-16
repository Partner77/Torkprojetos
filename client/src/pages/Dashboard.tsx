import { useState } from "react";
import { useProject } from "../hooks/useProject";
import { useWebSocket } from "../hooks/useWebSocket";
import FileTreeSidebar from "../components/FileTreeSidebar";
import ChatInterface from "../components/ChatInterface";
import AIConfigPanel from "../components/AIConfigPanel";
import ConfigurationModal from "../components/ConfigurationModal";
import type { AIAgent } from "../types";

export default function Dashboard() {
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
  // For now, use project ID 1 (the default project)
  const projectId = 1;
  const { project, agents, messages, files, pauseProject, resumeProject, updateAgent } = useProject(projectId);
  const { isConnected, sendMessage } = useWebSocket(projectId);

  const handleConfigureAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setIsConfigModalOpen(true);
  };

  const handleSaveAgentConfig = async (config: Partial<AIAgent>) => {
    if (selectedAgent) {
      await updateAgent.mutateAsync({
        agentId: selectedAgent.id,
        data: config
      });
      setIsConfigModalOpen(false);
      setSelectedAgent(null);
    }
  };

  const handleSendMessage = (content: string) => {
    sendMessage({
      type: 'send_message',
      content
    });
  };

  const handlePauseProject = () => {
    pauseProject.mutate();
  };

  const handleResumeProject = () => {
    resumeProject.mutate();
  };

  if (project.isLoading || agents.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (project.error || agents.error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive mb-4">Erro ao carregar o projeto</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/80"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - File Tree */}
      <FileTreeSidebar 
        files={files.data || []}
        projectId={projectId}
      />

      {/* Center - Chat Interface */}
      <ChatInterface 
        project={project.data}
        agents={agents.data || []}
        messages={messages.data || []}
        isConnected={isConnected}
        onSendMessage={handleSendMessage}
        onPauseProject={handlePauseProject}
        onResumeProject={handleResumeProject}
      />

      {/* Right Sidebar - AI Config Panel */}
      <AIConfigPanel 
        agents={agents.data || []}
        onConfigureAgent={handleConfigureAgent}
        onPauseProject={handlePauseProject}
        onResumeProject={handleResumeProject}
      />

      {/* Configuration Modal */}
      <ConfigurationModal 
        agent={selectedAgent}
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setSelectedAgent(null);
        }}
        onSave={handleSaveAgentConfig}
      />
    </div>
  );
}
