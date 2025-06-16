import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProject } from "../hooks/useProject";
import { 
  FolderPlus, 
  FilePlus, 
  Download, 
  Upload, 
  ChevronDown, 
  ChevronRight,
  Folder,
  File,
  FileCode,
  FileText
} from "lucide-react";
import type { ProjectFile } from "../types";

interface FileTreeSidebarProps {
  files: ProjectFile[];
  projectId: number;
}

export default function FileTreeSidebar({ files, projectId }: FileTreeSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]));
  const { createFile } = useProject(projectId);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: ProjectFile) => {
    if (file.type === "folder") {
      return <Folder className="w-4 h-4 text-accent" />;
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'json':
        return <FileText className="w-4 h-4 text-yellow-400" />;
      case 'css':
        return <FileCode className="w-4 h-4 text-green-400" />;
      case 'md':
        return <FileText className="w-4 h-4 text-gray-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const buildFileTree = (files: ProjectFile[]) => {
    const tree: { [key: string]: ProjectFile[] } = {};
    const folders = files.filter(f => f.type === "folder");
    const fileItems = files.filter(f => f.type === "file");

    // Group files by their parent directory
    fileItems.forEach(file => {
      const parentPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
      if (!tree[parentPath]) tree[parentPath] = [];
      tree[parentPath].push(file);
    });

    return { tree, folders };
  };

  const { tree, folders } = buildFileTree(files);

  const renderFileTree = (parentPath: string = "/", level: number = 0) => {
    const currentFolders = folders.filter(f => {
      const folderParent = f.path.substring(0, f.path.lastIndexOf('/')) || '/';
      return folderParent === parentPath;
    });

    const currentFiles = tree[parentPath] || [];
    
    return (
      <div className={`${level > 0 ? 'ml-4' : ''}`}>
        {/* Render folders first */}
        {currentFolders.map(folder => (
          <div key={folder.id}>
            <div 
              className="flex items-center py-1.5 px-3 hover:bg-primary/10 rounded-md cursor-pointer group"
              onClick={() => toggleFolder(folder.path)}
            >
              {expandedFolders.has(folder.path) ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground mr-2" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground mr-2" />
              )}
              {getFileIcon(folder)}
              <span className="ml-2 text-sm">{folder.name}</span>
            </div>
            {expandedFolders.has(folder.path) && renderFileTree(folder.path, level + 1)}
          </div>
        ))}

        {/* Render files */}
        {currentFiles.map(file => (
          <div 
            key={file.id}
            className="flex items-center py-1.5 px-3 hover:bg-primary/10 rounded-md cursor-pointer group"
          >
            <div className="w-5 mr-2" /> {/* Spacer for alignment */}
            {getFileIcon(file)}
            <span className="ml-2 text-sm">{file.name}</span>
            {file.updatedAt > file.createdAt && (
              <div className="ml-auto">
                <span className="text-xs text-success bg-success/20 px-2 py-0.5 rounded">
                  Editado
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleCreateFile = async () => {
    const fileName = prompt("Nome do arquivo:");
    if (fileName) {
      await createFile.mutateAsync({
        path: fileName,
        content: "",
        type: "file"
      });
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt("Nome da pasta:");
    if (folderName) {
      await createFile.mutateAsync({
        path: folderName,
        type: "folder"
      });
    }
  };

  const handleExportProject = () => {
    window.open(`/api/projects/${projectId}/export`, '_blank');
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Arquivos do Projeto</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateFile}
              className="p-2 hover:bg-primary/20"
            >
              <FilePlus className="w-4 h-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateFolder}
              className="p-2 hover:bg-secondary/20"
            >
              <FolderPlus className="w-4 h-4 text-secondary" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <span>{files.length} arquivos</span> • 
          <span className="ml-1">
            {Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024)} KB
          </span>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {renderFileTree()}
      </div>

      {/* Export/Import Actions */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Button 
            onClick={handleExportProject}
            className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Projeto
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="px-3"
          >
            <Upload className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
