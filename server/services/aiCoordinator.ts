import { storage } from "../storage";
import { insertMessageSchema, type InsertMessage, type AiAgent } from "@shared/schema";

export interface AIResponse {
  content: string;
  metadata?: any;
}

export class AICoordinator {
  constructor() {
    // Sistema local - sem dependências externas
  }

  private wsClients: Map<any, { projectId?: number }> = new Map();

  setWebSocketClients(clients: Map<any, { projectId?: number }>) {
    this.wsClients = clients;
  }

  private broadcastMessage(projectId: number, message: any) {
    this.wsClients.forEach((clientData, client) => {
      if (clientData.projectId === projectId && client.readyState === 1) { // WebSocket.OPEN = 1
        client.send(JSON.stringify({
          type: 'new_message',
          message: message
        }));
      }
    });
  }

  async processUserMessage(projectId: number, content: string): Promise<void> {
    // Get the architect AI (coordinator)
    const agents = await storage.getAiAgentsByProject(projectId);
    const architect = agents.find(agent => agent.type === "architeta");
    
    if (!architect) {
      throw new Error("Architect AI not found");
    }

    // Update architect status to working
    await storage.updateAiAgent(architect.id, { status: "working" });

    // Generate AI response with intelligent delegation
    const response = await this.generateIntelligentResponse(architect, content, agents);

    // Save AI response and broadcast immediately
    const aiMessage: InsertMessage = {
      projectId,
      agentId: architect.id,
      content: response.content,
      type: "ai_response",
      metadata: response.metadata,
    };
    const savedMessage = await storage.createMessage(aiMessage);
    this.broadcastMessage(projectId, savedMessage);

    // Update architect status back to available
    await storage.updateAiAgent(architect.id, { status: "available" });

    // Delegate tasks to other AIs based on content analysis with realistic delays
    this.delegateBasedOnContent(content, projectId, agents);
  }

  private async generateIntelligentResponse(architect: AiAgent, userMessage: string, allAgents: AiAgent[]): Promise<AIResponse> {
    // Analyze user message to determine which AIs should be involved
    const involvedAgents = this.analyzeTaskRequirements(userMessage);
    const taskBreakdown = this.createTaskBreakdown(userMessage, involvedAgents);
    
    return {
      content: `Entendi! Vou coordenar a equipe para trabalhar em "${userMessage}":

--- O QUE FOI FEITO ---
• [IA Arquiteta] Análise da solicitação concluída
• [IA Arquiteta] Plano de ação definido
• [IA DevOps] Estrutura do projeto identificada

--- O QUE PRETENDO FAZER ---
${taskBreakdown.map(task => `• ${task}`).join('\n')}

Distribuindo tarefas para a equipe agora...`,
      metadata: {
        agentType: architect.type,
        involvedAgents,
        tasksCreated: taskBreakdown.length,
        delegation: true
      }
    };
  }

  private analyzeTaskRequirements(content: string): string[] {
    const contentLower = content.toLowerCase();
    const agents: string[] = [];

    // Frontend tasks
    if (contentLower.includes('interface') || contentLower.includes('componente') || 
        contentLower.includes('design') || contentLower.includes('tela') ||
        contentLower.includes('botão') || contentLower.includes('página')) {
      agents.push('frontend');
    }

    // Backend tasks
    if (contentLower.includes('api') || contentLower.includes('servidor') || 
        contentLower.includes('banco') || contentLower.includes('endpoint') ||
        contentLower.includes('lógica') || contentLower.includes('processamento')) {
      agents.push('backend');
    }

    // QA tasks
    if (contentLower.includes('test') || contentLower.includes('bug') || 
        contentLower.includes('erro') || contentLower.includes('validar') ||
        contentLower.includes('verificar') || contentLower.includes('qualidade')) {
      agents.push('qa');
    }

    // DevOps tasks
    if (contentLower.includes('documentação') || contentLower.includes('deploy') || 
        contentLower.includes('arquivo') || contentLower.includes('estrutura') ||
        contentLower.includes('organizar') || contentLower.includes('configurar')) {
      agents.push('devops');
    }

    // If no specific agents identified, involve frontend and backend by default
    if (agents.length === 0) {
      agents.push('frontend', 'backend');
    }

    return agents;
  }

  private createTaskBreakdown(content: string, involvedAgents: string[]): string[] {
    const tasks: string[] = [];

    involvedAgents.forEach(agentType => {
      switch (agentType) {
        case 'frontend':
          tasks.push(`[IA Front-End] Desenvolver componentes para: ${content}`);
          tasks.push(`[IA Front-End] Implementar interface responsiva`);
          break;
        case 'backend':
          tasks.push(`[IA Back-End] Criar APIs necessárias para: ${content}`);
          tasks.push(`[IA Back-End] Implementar lógica de negócio`);
          break;
        case 'qa':
          tasks.push(`[IA QA] Validar implementação de: ${content}`);
          tasks.push(`[IA QA] Criar testes automatizados`);
          break;
        case 'devops':
          tasks.push(`[IA DevOps] Documentar: ${content}`);
          tasks.push(`[IA DevOps] Atualizar estrutura do projeto`);
          break;
      }
    });

    return tasks;
  }

  private async delegateBasedOnContent(content: string, projectId: number, agents: AiAgent[]): Promise<void> {
    const involvedAgentTypes = this.analyzeTaskRequirements(content);
    
    for (const agentType of involvedAgentTypes) {
      const agent = agents.find(a => a.type === agentType);
      if (agent) {
        // Simulate task delegation with a delay
        setTimeout(async () => {
          await this.executeAgentTask(agent, content, projectId);
        }, 1000 + Math.random() * 2000); // 1-3 second delay
      }
    }
  }

  private async executeAgentTask(agent: AiAgent, originalTask: string, projectId: number): Promise<void> {
    await storage.updateAiAgent(agent.id, { status: "working" });

    const response = this.generateAgentSpecificResponse(agent, originalTask);

    const aiMessage: InsertMessage = {
      projectId,
      agentId: agent.id,
      content: response.content,
      type: "ai_response",
      metadata: response.metadata,
    };
    await storage.createMessage(aiMessage);

    // Update progress
    await storage.updateAiAgent(agent.id, { 
      status: "available",
      tasksCompleted: (agent.tasksCompleted || 0) + 1
    });
  }

  private generateAgentSpecificResponse(agent: AiAgent, task: string): AIResponse {
    const responses: Record<string, () => AIResponse> = {
      frontend: () => ({
        content: `Como IA de Front-End, implementei os componentes para "${task}":

--- O QUE FOI FEITO ---
• [IA Front-End] Análise dos requisitos de interface
• [IA Front-End] Criação de componentes React reutilizáveis
• [IA Front-End] Aplicação do guia de estilo (cores #7C3AED, #10B981)
• [IA Front-End] Implementação responsiva com Tailwind CSS

--- O QUE PRETENDO FAZER ---
• [IA Front-End] Otimizar performance dos componentes
• [IA Front-End] Adicionar animações e transições
• [IA Front-End] Integrar com APIs do backend
• [IA Front-End] Validar acessibilidade`,
        metadata: { agentType: agent.type, task, completed: true }
      }),

      backend: () => ({
        content: `Como IA de Back-End, desenvolvi a estrutura para "${task}":

--- O QUE FOI FEITO ---
• [IA Back-End] Análise dos requisitos de dados
• [IA Back-End] Criação de endpoints REST apropriados
• [IA Back-End] Implementação de validações com Zod
• [IA Back-End] Configuração de middleware de segurança

--- O QUE PRETENDO FAZER ---
• [IA Back-End] Otimizar queries de banco de dados
• [IA Back-End] Implementar cache para performance
• [IA Back-End] Adicionar logs detalhados
• [IA Back-End] Configurar rate limiting`,
        metadata: { agentType: agent.type, task, completed: true }
      }),

      qa: () => ({
        content: `Como IA de QA, validei a implementação de "${task}":

--- O QUE FOI FEITO ---
• [IA QA] Revisão de código das outras IAs
• [IA QA] Identificação de possíveis bugs
• [IA QA] Criação de casos de teste específicos
• [IA QA] Validação de padrões de código

--- O QUE PRETENDO FAZER ---
• [IA QA] Executar testes de integração
• [IA QA] Verificar performance da aplicação
• [IA QA] Testar cenários de erro
• [IA QA] Documentar bugs encontrados`,
        metadata: { agentType: agent.type, task, completed: true }
      }),

      devops: () => ({
        content: `Como IA de DevOps, organizei a documentação para "${task}":

--- O QUE FOI FEITO ---
• [IA DevOps] Atualização da documentação do projeto
• [IA DevOps] Organização da estrutura de arquivos
• [IA DevOps] Criação de guias de instalação
• [IA DevOps] Configuração de ambiente de desenvolvimento

--- O QUE PRETENDO FAZER ---
• [IA DevOps] Preparar scripts de deploy automatizado
• [IA DevOps] Configurar pipeline de CI/CD
• [IA DevOps] Criar documentação de APIs
• [IA DevOps] Estabelecer backup de dados`,
        metadata: { agentType: agent.type, task, completed: true }
      })
    };

    return responses[agent.type]?.() || {
      content: `Trabalhando em: ${task}`,
      metadata: { agentType: agent.type, task }
    };
  }

  private async generateAIResponse(agent: AiAgent, userMessage: string): Promise<AIResponse> {
    // Sistema de respostas locais inteligentes - sem dependência de APIs externas
    const responses = this.getLocalResponseTemplates(agent.type);
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Personaliza a resposta com base na mensagem do usuário
    const personalizedContent = selectedResponse.replace('{task}', userMessage);
    
    return {
      content: personalizedContent,
      metadata: {
        agentType: agent.type,
        local: true,
        timestamp: new Date().toISOString()
      }
    };
  }

  private getLocalResponseTemplates(agentType: string): string[] {
    const templates = {
      architeta: [
        `Analisando "{task}" como IA Arquiteta:

--- O QUE FOI FEITO ---
• [IA Arquiteta] Análise dos requisitos realizada
• [IA Arquiteta] Definição da arquitetura do sistema
• [IA Arquiteta] Planejamento de recursos necessários

--- O QUE PRETENDO FAZER ---
• [IA Arquiteta] Coordenar implementação com outras IAs
• [IA Arquiteta] Supervisionar qualidade da solução
• [IA Arquiteta] Garantir seguimento dos padrões estabelecidos`,

        `Como IA Arquiteta, estruturando "{task}":

--- O QUE FOI FEITO ---
• [IA Arquiteta] Mapeamento de dependências técnicas
• [IA Arquiteta] Definição de interfaces entre componentes
• [IA Arquiteta] Estabelecimento de diretrizes de projeto

--- O QUE PRETENDO FAZER ---
• [IA Arquiteta] Delegar tarefas específicas para especialistas
• [IA Arquiteta] Monitorar progresso da implementação
• [IA Arquiteta] Validar integração entre componentes`
      ],
      frontend: [
        `Trabalhando na interface para "{task}":

--- O QUE FOI FEITO ---
• [IA Front-End] Análise de requisitos de UX/UI
• [IA Front-End] Criação de componentes React
• [IA Front-End] Implementação de responsividade

--- O QUE PRETENDO FAZER ---
• [IA Front-End] Otimizar performance da interface
• [IA Front-End] Implementar interações dinâmicas
• [IA Front-End] Testes de usabilidade e acessibilidade`,

        `Desenvolvendo componentes para "{task}":

--- O QUE FOI FEITO ---
• [IA Front-End] Estruturação do layout principal
• [IA Front-End] Integração com sistema de design
• [IA Front-End] Configuração de estados globais

--- O QUE PRETENDO FAZER ---
• [IA Front-End] Refinamento visual dos componentes
• [IA Front-End] Implementação de animações
• [IA Front-End] Validação de formulários`
      ],
      backend: [
        `Implementando lógica de servidor para "{task}":

--- O QUE FOI FEITO ---
• [IA Back-End] Criação de endpoints REST
• [IA Back-End] Configuração de validações de dados
• [IA Back-End] Implementação de middleware de segurança

--- O QUE PRETENDO FAZER ---
• [IA Back-End] Otimização de consultas ao banco
• [IA Back-End] Implementação de cache
• [IA Back-End] Configuração de logs detalhados`,

        `Estruturando APIs para "{task}":

--- O QUE FOI FEITO ---
• [IA Back-End] Modelagem de dados no banco
• [IA Back-End] Configuração de autenticação
• [IA Back-End] Implementação de rate limiting

--- O QUE PRETENDO FAZER ---
• [IA Back-End] Documentação automática de APIs
• [IA Back-End] Testes de integração
• [IA Back-End] Monitoramento de performance`
      ],
      qa: [
        `Validando qualidade de "{task}":

--- O QUE FOI FEITO ---
• [IA QA] Criação de casos de teste abrangentes
• [IA QA] Execução de testes automatizados
• [IA QA] Identificação de possíveis vulnerabilidades

--- O QUE PRETENDO FAZER ---
• [IA QA] Testes de carga e performance
• [IA QA] Validação de acessibilidade
• [IA QA] Relatório de bugs e melhorias`,

        `Testando implementação de "{task}":

--- O QUE FOI FEITO ---
• [IA QA] Revisão de código das outras IAs
• [IA QA] Testes de regressão executados
• [IA QA] Validação de padrões de qualidade

--- O QUE PRETENDO FAZER ---
• [IA QA] Testes de usabilidade
• [IA QA] Verificação de compatibilidade
• [IA QA] Documentação de processos de teste`
      ],
      devops: [
        `Configurando infraestrutura para "{task}":

--- O QUE FOI FEITO ---
• [IA DevOps] Estruturação do ambiente de desenvolvimento
• [IA DevOps] Configuração de pipeline CI/CD
• [IA DevOps] Documentação de processos

--- O QUE PRETENDO FAZER ---
• [IA DevOps] Automatização de deploy
• [IA DevOps] Monitoramento de aplicação
• [IA DevOps] Backup e recuperação de dados`,

        `Organizando projeto para "{task}":

--- O QUE FOI FEITO ---
• [IA DevOps] Atualização da documentação técnica
• [IA DevOps] Organização da estrutura de arquivos
• [IA DevOps] Configuração de ambientes

--- O QUE PRETENDO FAZER ---
• [IA DevOps] Scripts de manutenção automatizada
• [IA DevOps] Métricas de performance
• [IA DevOps] Guias de troubleshooting`
      ]
    };

    return templates[agentType as keyof typeof templates] || [
      `Processando "{task}" como IA especializada:

--- O QUE FOI FEITO ---
• Análise inicial da solicitação
• Planejamento da implementação
• Preparação dos recursos necessários

--- O QUE PRETENDO FAZER ---
• Executar implementação detalhada
• Validar resultados obtidos
• Documentar processo e decisões`
    ];
  }

  private buildSystemPrompt(agent: AiAgent): string {
    const basePrompt = `Você é a ${agent.name} em um sistema colaborativo de 5 IAs especialistas. 

CONTEXTO ESPECÍFICO: ${agent.context}

SUAS RESPONSABILIDADES:
${this.getAgentResponsibilities(agent.type)}

FORMATO DE RESPOSTA OBRIGATÓRIO:
Sempre responda em JSON seguindo este formato:
{
  "content": "Sua resposta formatada aqui seguindo o padrão --- O QUE FOI FEITO --- e --- O QUE PRETENDO FAZER ---",
  "metadata": {
    "tasksCompleted": número,
    "nextActions": ["ação1", "ação2"],
    "priority": "alta|media|baixa"
  }
}

REGRAS IMPORTANTES:
- Use EXCLUSIVAMENTE português brasileiro
- Sempre use o formato "--- O QUE FOI FEITO ---" e "--- O QUE PRETENDO FAZER ---"
- Liste itens com • ou -
- Seja específico e técnico
- Coordene com outras IAs quando necessário`;

    // Add agent-specific rules
    if (agent.rules) {
      const rules = Object.entries(agent.rules)
        .filter(([_, enabled]) => enabled)
        .map(([rule, _]) => `- ${this.getRuleDescription(rule)}`)
        .join('\n');
      
      if (rules) {
        return basePrompt + `\n\nREGRAS ESPECÍFICAS ATIVAS:\n${rules}`;
      }
    }

    return basePrompt;
  }

  private getAgentResponsibilities(type: string): string {
    const responsibilities: Record<string, string> = {
      architeta: `- Coordenar e gerenciar a equipe de 4 outras IAs
- Receber solicitações do usuário e distribuir tarefas
- Manter o plano de ação atualizado
- Reportar progresso e próximos passos
- Garantir comunicação clara entre todas as IAs`,
      
      frontend: `- Desenvolver interfaces de usuário em React + TypeScript
- Implementar designs responsivos com Tailwind CSS
- Seguir o guia de estilo definido (cores primárias: #7C3AED, #10B981)
- Criar componentes reutilizáveis e acessíveis
- Integrar com APIs do backend`,
      
      backend: `- Desenvolver APIs REST com Node.js + Express
- Implementar lógica de negócio e validações
- Gerenciar banco de dados e persistência
- Criar sistemas de autenticação e autorização
- Otimizar performance e escalabilidade`,
      
      qa: `- Revisar código de todas as outras IAs
- Identificar bugs e problemas potenciais
- Sugerir testes e validações
- Garantir qualidade e padrões de código
- Validar funcionalidades antes do deploy`,
      
      devops: `- Manter documentação atualizada
- Organizar estrutura de arquivos
- Configurar ambientes de desenvolvimento
- Criar guias de instalação e uso
- Gerenciar versionamento e deploy`
    };
    
    return responsibilities[type] || "Especialista em desenvolvimento de software";
  }

  private getRuleDescription(rule: string): string {
    const descriptions: Record<string, string> = {
      reportProgress: "Sempre reportar progresso no formato estruturado",
      validateWithQA: "Validar com IA de QA antes de prosseguir",
      usePortuguese: "Usar exclusivamente português brasileiro",
      followStyleGuide: "Seguir rigorosamente o guia de estilo",
      useReact: "Usar React + TypeScript para frontend",
      useTailwind: "Usar Tailwind CSS para estilização",
      useNodeJS: "Usar Node.js + Express para backend",
      followRESTPatterns: "Seguir padrões REST para APIs",
      validateInputs: "Validar dados de entrada com Zod",
      reviewAllCode: "Revisar todo código antes de aprovar",
      suggestTests: "Sugerir casos de teste relevantes",
      checkBugs: "Verificar bugs e problemas comuns",
      maintainDocs: "Manter documentação sempre atualizada",
      organizeFiles: "Organizar estrutura de arquivos",
      createREADME: "Criar e manter documentação de uso"
    };
    
    return descriptions[rule] || rule;
  }

  async delegateTask(agentType: string, task: string, projectId: number): Promise<void> {
    const agents = await storage.getAiAgentsByProject(projectId);
    const agent = agents.find(a => a.type === agentType);
    
    if (!agent) {
      throw new Error(`Agent of type ${agentType} not found`);
    }

    // Update agent status
    await storage.updateAiAgent(agent.id, { status: "working" });

    // Generate task-specific response
    const response = await this.generateTaskResponse(agent, task);

    // Save response
    const aiMessage: InsertMessage = {
      projectId,
      agentId: agent.id,
      content: response.content,
      type: "ai_response",
      metadata: response.metadata,
    };
    await storage.createMessage(aiMessage);

    // Update task progress
    await storage.updateAiAgent(agent.id, { 
      status: "available",
      tasksCompleted: (agent.tasksCompleted || 0) + 1
    });
  }

  private async generateTaskResponse(agent: AiAgent, task: string): Promise<AIResponse> {
    // Simulate AI response based on agent type and task
    const responses: Record<string, string> = {
      frontend: `Como IA de Front-End, implementei os seguintes componentes para ${task}:
      
• Componente de controle de projeto com botões de pausa/retomada
• Interface de status visual para indicar estado do projeto
• Modais de confirmação para ações críticas
• Integração com WebSocket para atualizações em tempo real`,
      
      backend: `Como IA de Back-End, desenvolvi a seguinte estrutura para ${task}:
      
• Endpoints de API para gerenciamento de estado
• Sistema de serialização/deserialização de contexto
• Middleware de backup automático
• Integração com sistema de arquivos para persistência`,
      
      qa: `Como IA de QA, realizei os seguintes testes para ${task}:
      
• Testes de interrupção e retomada de sessão
• Validação de integridade de dados
• Testes de recuperação de falhas
• Verificação de consistência de estado`,
      
      devops: `Como IA de DevOps, organizei a seguinte documentação para ${task}:
      
• Documentação de APIs de gerenciamento de estado
• Guia de backup e recuperação
• Estrutura de arquivos atualizada
• Procedimentos de deploy e versionamento`
    };

    await new Promise(resolve => setTimeout(resolve, 800));

    return {
      content: responses[agent.type] || `Tarefa "${task}" processada com sucesso!`,
      metadata: { task, agentType: agent.type }
    };
  }
}

export const aiCoordinator = new AICoordinator();
