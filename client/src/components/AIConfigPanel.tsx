import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Settings,
  Pause,
  RotateCcw,
  Crown,
  Palette,
  Server,
  Shield,
  Wrench
} from "lucide-react";
import type { AIAgent } from "../types";

interface AIConfigPanelProps {
  agents: AIAgent[];
  onConfigureAgent: (agent: AIAgent) => void;
  onPauseProject: () => void;
  onResumeProject: () => void;
}

export default function AIConfigPanel({ 
  agents, 
  onConfigureAgent, 
  onPauseProject,
  onResumeProject 
}: AIConfigPanelProps) {
  
  const getAgentIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      architeta: <Crown className="w-5 h-5 text-primary" />,
      frontend: <Palette className="w-5 h-5 text-blue-400" />,
      backend: <Server className="w-5 h-5 text-secondary" />,
      qa: <Shield className="w-5 h-5 text-red-400" />,
      devops: <Wrench className="w-5 h-5 text-purple-400" />
    };
    return icons[type] || <Server className="w-5 h-5 text-gray-400" />;
  };

  const getAgentColor = (type: string) => {
    const colors: Record<string, string> = {
      architeta: "border-primary/30 text-primary",
      frontend: "border-blue-500/30 text-blue-400",
      backend: "border-secondary/30 text-secondary",
      qa: "border-red-500/30 text-red-400",
      devops: "border-purple-500/30 text-purple-400"
    };
    return colors[type] || "border-gray-500/30 text-gray-400";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string; dot: string }> = {
      available: { color: "text-success", text: "Disponível", dot: "bg-success" },
      working: { color: "text-yellow-400", text: "Trabalhando", dot: "bg-yellow-400 animate-pulse" },
      waiting: { color: "text-gray-400", text: "Aguardando", dot: "bg-gray-400" },
      error: { color: "text-destructive", text: "Erro", dot: "bg-destructive" }
    };
    
    const config = statusConfig[status] || statusConfig.available;
    
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
        <span className={`text-xs ${config.color}`}>{config.text}</span>
      </div>
    );
  };

  const getAgentTitle = (type: string) => {
    const titles: Record<string, string> = {
      architeta: "Gerente de Projeto",
      frontend: "Interface & UX",
      backend: "APIs & Lógica",
      qa: "Qualidade & Testes",
      devops: "Documentação & Deploy"
    };
    return titles[type] || "Especialista";
  };

  const activeAgents = agents.filter(agent => agent.status !== "error").length;

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg mb-3">Status das IAs</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{activeAgents} IAs ativas</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full" />
            <span className="text-success">Sistema operacional</span>
          </div>
        </div>
      </div>

      {/* AI Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {agents.map((agent) => {
          const completionPercentage = agent.tasksTotal > 0 
            ? (agent.tasksCompleted / agent.tasksTotal) * 100 
            : 0;

          return (
            <div key={agent.id} className={`bg-background rounded-lg p-4 border ${getAgentColor(agent.type)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/50">
                    {getAgentIcon(agent.type)}
                  </div>
                  <div>
                    <h3 className={`font-medium ${getAgentColor(agent.type).split(' ')[1]}`}>
                      {agent.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {getAgentTitle(agent.type)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(agent.status)}
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tarefas completadas:</span>
                  <span className={getAgentColor(agent.type).split(' ')[1]}>
                    {agent.tasksCompleted}/{agent.tasksTotal}
                  </span>
                </div>
                <Progress value={completionPercentage} className="h-1.5" />
              </div>
              
              <Button 
                onClick={() => onConfigureAgent(agent)}
                variant="ghost"
                size="sm"
                className={`w-full hover:bg-${agent.type === 'architeta' ? 'primary' : agent.type === 'frontend' ? 'blue-500' : agent.type === 'backend' ? 'secondary' : agent.type === 'qa' ? 'red-500' : 'purple-500'}/30`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar Regras
              </Button>
            </div>
          );
        })}
      </div>

      {/* Global Configuration */}
      <div className="p-4 border-t border-border">
        <div className="space-y-3">
          <Button 
            variant="default"
            className="w-full bg-accent hover:bg-accent/80 text-accent-foreground"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configuração Global
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={onPauseProject}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </Button>
            <Button
              onClick={onResumeProject}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
