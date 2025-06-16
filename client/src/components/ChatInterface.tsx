import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  User, 
  Send, 
  Paperclip, 
  Save,
  Pause,
  Play,
  Wifi,
  WifiOff
} from "lucide-react";
import type { Project, AIAgent, Message } from "../types";

interface ChatInterfaceProps {
  project?: Project;
  agents: AIAgent[];
  messages: Message[];
  isConnected: boolean;
  onSendMessage: (content: string) => void;
  onPauseProject: () => void;
  onResumeProject: () => void;
}

export default function ChatInterface({ 
  project, 
  agents, 
  messages, 
  isConnected,
  onSendMessage, 
  onPauseProject,
  onResumeProject 
}: ChatInterfaceProps) {
  const [messageContent, setMessageContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (messageContent.trim()) {
      onSendMessage(messageContent);
      setMessageContent("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getAgentById = (agentId: number | null) => {
    return agents.find(agent => agent.id === agentId);
  };

  const getAgentIcon = (agentType: string) => {
    const icons: Record<string, string> = {
      architeta: "👑",
      frontend: "🎨",
      backend: "🔧",
      qa: "🛡️",
      devops: "🔧"
    };
    return icons[agentType] || "🤖";
  };

  const getAgentColor = (agentType: string) => {
    const colors: Record<string, string> = {
      architeta: "text-primary",
      frontend: "text-blue-400",
      backend: "text-secondary",
      qa: "text-red-400",
      devops: "text-purple-400"
    };
    return colors[agentType] || "text-gray-400";
  };

  const formatMessageContent = (content: string) => {
    // Format structured messages with proper styling
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.includes('--- O QUE FOI FEITO ---')) {
        return (
          <div key={index} className="font-mono text-sm bg-background rounded-md p-3 my-2">
            <div className="text-success font-semibold mb-2">--- O QUE FOI FEITO ---</div>
          </div>
        );
      }
      if (line.includes('--- O QUE PRETENDO FAZER ---')) {
        return (
          <div key={index} className="font-mono text-sm">
            <div className="text-accent font-semibold mb-2">--- O QUE PRETENDO FAZER ---</div>
          </div>
        );
      }
      if (line.startsWith('•') || line.startsWith('-')) {
        return (
          <div key={index} className="font-mono text-sm ml-4">
            {line}
          </div>
        );
      }
      return <div key={index}>{line}</div>;
    });
  };

  const tokenUsagePercentage = project ? (project.tokensUsed / (project.tokensUsed + project.tokensRemaining)) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl text-primary">Sistema de Coordenação de IAs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Projeto ativo: <span className="text-accent">{project?.name || "Carregando..."}</span>
            </p>
          </div>
          
          {/* Token Management & Status */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium">Tokens Disponíveis</div>
                <div className="text-xs text-muted-foreground">Sessão atual</div>
              </div>
              <div className="bg-background rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Progress value={tokenUsagePercentage} className="w-24 h-2" />
                  <span className="text-sm font-mono">
                    {project?.tokensRemaining || 0}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-success" />
                  <span className="text-sm text-success">Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-destructive" />
                  <span className="text-sm text-destructive">Desconectado</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {messages.map((message) => {
          const agent = getAgentById(message.agentId);
          const isUser = message.type === "user";
          
          return (
            <div key={message.id} className="flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                isUser ? 'bg-accent' : 'bg-primary'
              }`}>
                {isUser ? (
                  <User className="w-5 h-5 text-accent-foreground" />
                ) : (
                  <Bot className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-semibold ${isUser ? 'text-accent' : getAgentColor(agent?.type || '')}`}>
                    {isUser ? 'Você' : agent?.name || 'Sistema'}
                  </span>
                  {!isUser && agent && (
                    <Badge variant="secondary" className="text-xs">
                      {getAgentIcon(agent.type)} {agent.type}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                
                <div className={`rounded-lg p-4 ${
                  isUser 
                    ? 'bg-accent/10 border border-accent/20' 
                    : 'bg-card border-l-4 border-primary'
                }`}>
                  <div className="whitespace-pre-wrap">
                    {formatMessageContent(message.content)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="bg-card rounded-lg border border-border">
          <Textarea
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem para a equipe de IAs... (Shift+Enter para nova linha)"
            className="border-0 resize-none focus:ring-0 min-h-[100px]"
            maxLength={4000}
          />
          <div className="flex justify-between items-center px-4 pb-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Paperclip className="w-4 h-4 mr-2" />
                Anexar arquivo
              </Button>
              <div className="text-xs text-muted-foreground">
                {messageContent.length}/4000 caracteres
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Salvar Estado
              </Button>
              {project?.status === "paused" ? (
                <Button onClick={onResumeProject} variant="outline" size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Retomar
                </Button>
              ) : (
                <Button onClick={onPauseProject} variant="outline" size="sm">
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
              )}
              <Button 
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || !isConnected}
                className="bg-primary hover:bg-primary/80"
              >
                Enviar
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
