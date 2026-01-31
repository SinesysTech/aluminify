'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CalendarCheck,
  MessageSquare,
  LayoutDashboard,
  BookOpen,
  Circle,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Save,
  Lock,
  Eye,
  EyeOff,
  Bot,
  Clock,
  Library,
  Layers,
  CalendarPlus,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/app/shared/components/forms/input';
import { Label } from '@/app/shared/components/forms/label';
import { Switch } from '@/app/shared/components/forms/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type {
  ModuleWithVisibility,
  BulkUpdateModuleVisibilityInput,
  UpdateModuleVisibilityInput,
  UpdateSubmoduleVisibilityInput,
} from '@/app/[tenant]/(modules)/empresa/services/module-visibility.types';

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  Calendar,
  MessageSquare,
  Bot,
  Clock,
  Library,
  Layers,
  CalendarPlus,
};

function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Circle;
}

// Local state types for editing
interface ModuleEditState {
  id: string;
  isVisible: boolean;
  customName: string;
  displayOrder: number;
  isCore: boolean;
  originalName: string;
  iconName: string;
  submodules: SubmoduleEditState[];
}

interface SubmoduleEditState {
  id: string;
  moduleId: string;
  isVisible: boolean;
  customName: string;
  displayOrder: number;
  originalName: string;
}

interface ModuleVisibilityPanelProps {
  empresaId: string;
  initialConfig?: ModuleWithVisibility[];
  onSave: (input: BulkUpdateModuleVisibilityInput) => Promise<void>;
  onReset: () => Promise<void>;
  onCancel: () => void;
}

export function ModuleVisibilityPanel({
  empresaId: _empresaId,
  initialConfig,
  onSave,
  onReset,
  onCancel,
}: ModuleVisibilityPanelProps) {
  const [modules, setModules] = useState<ModuleEditState[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const params = useParams();
  const tenantSlug = params?.tenant as string;

  // Initialize state from config
  useEffect(() => {
    if (initialConfig) {
      const editState: ModuleEditState[] = initialConfig
        .filter((module) => {
          // HIDE generic assistant for everyone
          if (module.id === 'agente') return false;

          // HIDE TobIAs for non-CDF tenants
          if (module.id === 'tobias') {
            const isCDF = tenantSlug === 'cdf' || tenantSlug === 'cdf-curso-de-fsica';
            return isCDF;
          }

          return true;
        })
        .map((module) => ({
          id: module.id,
          isVisible: module.visibility?.isVisible ?? true,
          customName: module.visibility?.customName || '',
          displayOrder: module.visibility?.displayOrder ?? module.displayOrder,
          isCore: module.isCore,
          originalName: module.name,
          iconName: module.iconName,
          submodules: module.submodules.map((sub) => ({
            id: sub.id,
            moduleId: module.id,
            isVisible: sub.visibility?.isVisible ?? true,
            customName: sub.visibility?.customName || '',
            displayOrder: sub.visibility?.displayOrder ?? sub.displayOrder,
            originalName: sub.name,
          })),
        }));
      setModules(editState);
      setHasChanges(false);
    }
  }, [initialConfig, tenantSlug]);

  // Toggle module expansion
  const toggleExpanded = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  // Update module visibility
  const updateModuleVisibility = (moduleId: string, isVisible: boolean) => {
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId ? { ...m, isVisible } : m
      )
    );
    setHasChanges(true);
  };

  // Update module name
  const updateModuleName = (moduleId: string, customName: string) => {
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId ? { ...m, customName } : m
      )
    );
    setHasChanges(true);
  };

  // Update submodule visibility
  const updateSubmoduleVisibility = (moduleId: string, submoduleId: string, isVisible: boolean) => {
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId
          ? {
            ...m,
            submodules: m.submodules.map(s =>
              s.id === submoduleId ? { ...s, isVisible } : s
            ),
          }
          : m
      )
    );
    setHasChanges(true);
  };

  // Update submodule name
  const updateSubmoduleName = (moduleId: string, submoduleId: string, customName: string) => {
    setModules(prev =>
      prev.map(m =>
        m.id === moduleId
          ? {
            ...m,
            submodules: m.submodules.map(s =>
              s.id === submoduleId ? { ...s, customName } : s
            ),
          }
          : m
      )
    );
    setHasChanges(true);
  };

  // Move module up/down
  const moveModule = (moduleId: string, direction: 'up' | 'down') => {
    setModules(prev => {
      const index = prev.findIndex(m => m.id === moduleId);
      if (index === -1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newModules = [...prev];
      [newModules[index], newModules[newIndex]] = [newModules[newIndex], newModules[index]];

      // Update display orders
      return newModules.map((m, i) => ({ ...m, displayOrder: i + 1 }));
    });
    setHasChanges(true);
  };

  // Build save payload
  const buildSavePayload = useCallback((): BulkUpdateModuleVisibilityInput => {
    const moduleUpdates: UpdateModuleVisibilityInput[] = modules.map((m, index) => ({
      moduleId: m.id,
      isVisible: m.isVisible,
      customName: m.customName || null,
      displayOrder: index + 1,
    }));

    const submoduleUpdates: UpdateSubmoduleVisibilityInput[] = modules.flatMap(m =>
      m.submodules.map((s, index) => ({
        moduleId: m.id,
        submoduleId: s.id,
        isVisible: s.isVisible,
        customName: s.customName || null,
        displayOrder: index + 1,
      }))
    );

    return {
      modules: moduleUpdates,
      submodules: submoduleUpdates,
    };
  }, [modules]);

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = buildSavePayload();
      await onSave(payload);
      setHasChanges(false);
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    setResetting(true);
    try {
      await onReset();
      setHasChanges(false);
    } catch {
      // Error handled by parent
    } finally {
      setResetting(false);
    }
  };

  // Cancel changes
  const handleCancel = () => {
    onCancel();
    setHasChanges(false);
  };

  if (!initialConfig || modules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
          <CardDescription>Carregando configuração de módulos</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {hasChanges ? (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Alterações não salvas
            </Badge>
          ) : (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Salvo
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={resetting}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar para padrão
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Resetar configuração?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso vai restaurar todos os módulos para a configuração padrão.
                  Todos os módulos ficarão visíveis com seus nomes originais.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Resetar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {hasChanges && (
            <Button variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
          )}

          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Module list */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos da Sidebar</CardTitle>
          <CardDescription>
            Configure quais módulos os alunos poderão ver. Use as setas para reordenar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {modules.map((module, index) => {
            const IconComponent = getIconComponent(module.iconName);
            const isExpanded = expandedModules.has(module.id);
            const hasSubmodules = module.submodules.length > 0;
            const displayName = module.customName || module.originalName;

            return (
              <div key={module.id} className="border rounded-lg">
                <div className="flex items-center gap-3 p-4">
                  {/* Reorder controls */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => moveModule(module.id, 'up')}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === modules.length - 1}
                      onClick={() => moveModule(module.id, 'down')}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Module info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Input
                        value={module.customName}
                        onChange={e => updateModuleName(module.id, e.target.value)}
                        placeholder={module.originalName}
                        className="h-8 w-48"
                      />
                      {module.isCore && (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Essencial
                        </Badge>
                      )}
                    </div>
                    {module.customName && module.customName !== module.originalName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Original: {module.originalName}
                      </p>
                    )}
                  </div>

                  {/* Visibility toggle */}
                  <div className="flex items-center gap-2">
                    {module.isCore ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">Sempre visível</span>
                      </div>
                    ) : (
                      <>
                        <Label htmlFor={`module-${module.id}`} className="sr-only">
                          Visibilidade do módulo {displayName}
                        </Label>
                        <Switch
                          id={`module-${module.id}`}
                          checked={module.isVisible}
                          onCheckedChange={checked => updateModuleVisibility(module.id, checked)}
                        />
                        {module.isVisible ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </>
                    )}
                  </div>

                  {/* Expand/collapse for submodules */}
                  {hasSubmodules && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpanded(module.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Submodules */}
                {hasSubmodules && isExpanded && (
                  <div className="border-t bg-muted/30 p-4 space-y-3">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Subitens</p>
                    {module.submodules.map(submodule => {
                      const subDisplayName = submodule.customName || submodule.originalName;

                      return (
                        <div
                          key={`${module.id}-${submodule.id}`}
                          className="flex items-center gap-3 pl-8"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Input
                                value={submodule.customName}
                                onChange={e =>
                                  updateSubmoduleName(module.id, submodule.id, e.target.value)
                                }
                                placeholder={submodule.originalName}
                                className="h-8 w-40"
                              />
                            </div>
                            {submodule.customName && submodule.customName !== submodule.originalName && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Original: {submodule.originalName}
                              </p>
                            )}
                          </div>

                          {/* Submodule visibility toggle */}
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`submodule-${module.id}-${submodule.id}`}
                              className="sr-only"
                            >
                              Visibilidade do subitem {subDisplayName}
                            </Label>
                            <Switch
                              id={`submodule-${module.id}-${submodule.id}`}
                              checked={submodule.isVisible}
                              onCheckedChange={checked =>
                                updateSubmoduleVisibility(module.id, submodule.id, checked)
                              }
                              disabled={!module.isVisible}
                            />
                            {submodule.isVisible && module.isVisible ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Preview section */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            Visualização de como a sidebar vai aparecer para os alunos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-sidebar rounded-lg p-4 max-w-xs">
            <div className="space-y-1">
              {modules
                .filter(m => m.isVisible)
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map(module => {
                  const IconComponent = getIconComponent(module.iconName);
                  const displayName = module.customName || module.originalName;
                  const visibleSubmodules = module.submodules.filter(s => s.isVisible);

                  return (
                    <div key={module.id}>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground">
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm">{displayName}</span>
                      </div>
                      {visibleSubmodules.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {visibleSubmodules.map(sub => (
                            <div
                              key={`preview-${module.id}-${sub.id}`}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70"
                            >
                              <span className="text-sm">
                                {sub.customName || sub.originalName}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ChevronUp component (not exported from lucide by default in some versions)
function ChevronUp({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
}
