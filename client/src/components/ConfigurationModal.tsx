import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AIAgent } from "../types";

interface ConfigurationModalProps {
  agent: AIAgent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: Partial<AIAgent>) => void;
}

export default function ConfigurationModal({ agent, isOpen, onClose, onSave }: ConfigurationModalProps) {
  const [context, setContext] = useState("");
  const [rules, setRules] = useState<any>({});
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (agent) {
      setContext(agent.context || "");
      setRules(agent.rules || {});
      setConfig(agent.config || { temperature: 0.7, maxTokens: 4096 });
    }
  }, [agent]);

  const handleSave = () => {
    onSave({
      context,
      rules,
      config
    });
  };

  const handleRuleChange = (ruleKey: string, value: boolean) => {
    setRules(prev => ({ ...prev, [ruleKey]: value }));
  };

  const handleConfigChange = (configKey: string, value: any) => {
    setConfig(prev => ({ ...prev, [configKey]: value }));
  };

  if (!agent) return null;

  const getAgentSpecificRules = (agentType: string) => {
    switch (agentType) {
      case 'architeta':
        return [
          { key: 'reportProgress', label: 'Sempre reportar progresso', description: 'Utilizar formato "O que foi feito / O que pretendo fazer"' },
          { key: 'validateWithQA', label: 'Validar com QA antes de prosseguir', description: 'Aguardar aprovação da IA de Qualidade' },
          { key: 'usePortuguese', label: 'Usar português brasileiro', description: 'Toda comunicação deve ser em PT-BR' }
        ];
      case 'frontend':
        return [
          { key: 'followStyleGuide', label: 'Seguir guia de estilo', description: 'Usar cores e componentes especificados' },
          { key: 'useReact', label: 'Usar React + TypeScript', description: 'Priorizar componentes funcionais' },
          { key: 'useTailwind', label: 'Usar Tailwind CSS', description: 'Para estilização responsiva' }
        ];
      case 'backend':
        return [
          { key: 'useNodeJS', label: 'Usar Node.js + Express', description: 'Stack padrão do projeto' },
          { key: 'followRESTPatterns', label: 'Seguir padrões REST', description: 'APIs bem estruturadas' },
          { key: 'validateInputs', label: 'Validar dados de entrada', description: 'Usar Zod para validação' }
        ];
      case 'qa':
        return [
          { key: 'reviewAllCode', label: 'Revisar todo código', description: 'Antes de aprovar mudanças' },
          { key: 'suggestTests', label: 'Sugerir testes', description: 'Propor casos de teste relevantes' },
          { key: 'checkBugs', label: 'Verificar bugs comuns', description: 'Identificar problemas potenciais' }
        ];
      case 'devops':
        return [
          { key: 'maintainDocs', label: 'Manter documentação', description: 'Atualizar README e comentários' },
          { key: 'organizeFiles', label: 'Organizar arquivos', description: 'Estrutura limpa do projeto' },
          { key: 'createREADME', label: 'Criar documentação', description: 'Guias de uso e instalação' }
        ];
      default:
        return [];
    }
  };

  const agentRules = getAgentSpecificRules(agent.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-primary">
            Configuração da {agent.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          {/* Contexto personalizado */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Contexto Personalizado</Label>
            <Textarea 
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Defina o contexto específico para esta IA..."
              className="min-h-[100px]"
            />
          </div>

          {/* Regras de comportamento */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Regras de Comportamento</Label>
            <div className="space-y-3">
              {agentRules.map((rule) => (
                <div key={rule.key} className="flex items-center justify-between p-3 bg-background rounded-md border">
                  <div>
                    <div className="font-medium text-sm">{rule.label}</div>
                    <div className="text-xs text-muted-foreground">{rule.description}</div>
                  </div>
                  <Switch 
                    checked={rules[rule.key] || false}
                    onCheckedChange={(checked) => handleRuleChange(rule.key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Parâmetros avançados */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Parâmetros Avançados</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Temperature</Label>
                <Slider
                  value={[config.temperature || 0.7]}
                  onValueChange={(value) => handleConfigChange('temperature', value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="mb-2"
                />
                <div className="text-xs text-muted-foreground">
                  {config.temperature || 0.7} (Criatividade)
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Max Tokens</Label>
                <Input 
                  type="number"
                  value={config.maxTokens || 4096}
                  onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Prioridade de comunicação */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Prioridade de Comunicação</Label>
            <div className="space-y-2">
              {['frontend', 'backend', 'qa', 'devops'].filter(type => type !== agent.type).map((otherType) => (
                <div key={otherType} className="flex items-center justify-between p-2 bg-background rounded border">
                  <span className="text-sm capitalize">IA {otherType}</span>
                  <Select defaultValue="media">
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="baixa">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/80">
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
