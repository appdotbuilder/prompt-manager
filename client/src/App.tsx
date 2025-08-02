
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { 
  PromptWithTags, 
  Tag, 
  PromptComponent,
  CreatePromptInput, 
  CreateTagInput,
  CreatePromptComponentInput,
  UpdatePromptInput,
  GeneratePromptInput
} from '../../server/src/schema';

function App() {
  // State management
  const [prompts, setPrompts] = useState<PromptWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [promptComponents, setPromptComponents] = useState<PromptComponent[]>([]);
  const [templates, setTemplates] = useState<PromptWithTags[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('prompts');

  // Form states
  const [promptForm, setPromptForm] = useState<CreatePromptInput>({
    title: '',
    content: '',
    type: 'chatgpt',
    is_template: false,
    template_variables: null,
    tag_ids: []
  });

  const [tagForm, setTagForm] = useState<CreateTagInput>({
    name: '',
    color: null
  });

  const [componentForm, setComponentForm] = useState<CreatePromptComponentInput>({
    name: '',
    content: '',
    category: '',
    type: 'chatgpt'
  });

  const [generatorForm, setGeneratorForm] = useState<GeneratePromptInput>({
    template_id: 0,
    variables: {},
    component_ids: []
  });

  const [editingPrompt, setEditingPrompt] = useState<PromptWithTags | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [templateVariables, setTemplateVariables] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [jsonEditor, setJsonEditor] = useState('');

  // Load data functions
  const loadPrompts = useCallback(async () => {
    try {
      const result = await trpc.getPrompts.query();
      setPrompts(result);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const result = await trpc.getTags.query();
      setTags(result);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  const loadComponents = useCallback(async () => {
    try {
      const result = await trpc.getPromptComponents.query();
      setPromptComponents(result);
    } catch (error) {
      console.error('Failed to load components:', error);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const result = await trpc.getTemplates.query();
      setTemplates(result);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
    loadTags();
    loadComponents();
    loadTemplates();
  }, [loadPrompts, loadTags, loadComponents, loadTemplates]);

  // Form handlers
  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = {
        ...promptForm,
        tag_ids: selectedTags,
        template_variables: promptForm.is_template && templateVariables 
          ? templateVariables.split(',').map((v: string) => v.trim()).filter(Boolean)
          : null
      };
      const response = await trpc.createPrompt.mutate(formData);
      setPrompts((prev: PromptWithTags[]) => [...prev, response]);
      resetPromptForm();
    } catch (error) {
      console.error('Failed to create prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdatePromptInput = {
        id: editingPrompt.id,
        title: promptForm.title,
        content: promptForm.content,
        type: promptForm.type,
        is_template: promptForm.is_template,
        template_variables: promptForm.is_template && templateVariables 
          ? templateVariables.split(',').map((v: string) => v.trim()).filter(Boolean)
          : null,
        tag_ids: selectedTags
      };
      const response = await trpc.updatePrompt.mutate(updateData);
      setPrompts((prev: PromptWithTags[]) => 
        prev.map((p: PromptWithTags) => p.id === editingPrompt.id ? response : p)
      );
      setEditingPrompt(null);
      resetPromptForm();
    } catch (error) {
      console.error('Failed to update prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrompt = async (id: number) => {
    try {
      await trpc.deletePrompt.mutate({ id });
      setPrompts((prev: PromptWithTags[]) => prev.filter((p: PromptWithTags) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createTag.mutate(tagForm);
      setTags((prev: Tag[]) => [...prev, response]);
      setTagForm({ name: '', color: null });
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createPromptComponent.mutate(componentForm);
      setPromptComponents((prev: PromptComponent[]) => [...prev, response]);
      setComponentForm({ name: '', content: '', category: '', type: 'chatgpt' });
    } catch (error) {
      console.error('Failed to create component:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.generatePrompt.mutate(generatorForm);
      setGeneratedPrompt(response.generated_content || 'No content generated');
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      setGeneratedPrompt('Error generating prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPromptForm = () => {
    setPromptForm({
      title: '',
      content: '',
      type: 'chatgpt',
      is_template: false,
      template_variables: null,
      tag_ids: []
    });
    setSelectedTags([]);
    setTemplateVariables('');
  };

  const startEditPrompt = (prompt: PromptWithTags) => {
    setEditingPrompt(prompt);
    setPromptForm({
      title: prompt.title,
      content: prompt.content,
      type: prompt.type,
      is_template: prompt.is_template,
      template_variables: prompt.template_variables,
      tag_ids: prompt.tags.map((tag: Tag) => tag.id)
    });
    setSelectedTags(prompt.tags.map((tag: Tag) => tag.id));
    setTemplateVariables(prompt.template_variables?.join(', ') || '');
  };

  const getTypeIcon = (type: 'chatgpt' | 'midjourney') => {
    return type === 'chatgpt' ? '🤖' : '🎨';
  };

  const getTypeColor = (type: 'chatgpt' | 'midjourney') => {
    return type === 'chatgpt' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ✨ Prompt Manager
          </h1>
          <p className="text-gray-600">
            Create, organize, and generate prompts for ChatGPT & Midjourney
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="prompts">📝 Prompts</TabsTrigger>
            <TabsTrigger value="generator">⚡ Generator</TabsTrigger>
            <TabsTrigger value="components">🧩 Components</TabsTrigger>
            <TabsTrigger value="tags">🏷️ Tags</TabsTrigger>
            <TabsTrigger value="json">💻 JSON Editor</TabsTrigger>
          </TabsList>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingPrompt ? '✏️ Edit Prompt' : '➕ Create New Prompt'}
                </CardTitle>
                <CardDescription>
                  {editingPrompt 
                    ? 'Update your existing prompt' 
                    : 'Add a new prompt to your collection'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingPrompt ? handleUpdatePrompt : handleCreatePrompt} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter prompt title..."
                        value={promptForm.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPromptForm((prev: CreatePromptInput) => ({ ...prev, title: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={promptForm.type || 'chatgpt'}
                        onValueChange={(value: 'chatgpt' | 'midjourney') =>
                          setPromptForm((prev: CreatePromptInput) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chatgpt">🤖 ChatGPT</SelectItem>
                          <SelectItem value="midjourney">🎨 Midjourney</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content">Prompt Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter your prompt content..."
                      value={promptForm.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setPromptForm((prev: CreatePromptInput) => ({ ...prev, content: e.target.value }))
                      }
                      rows={6}
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="template"
                      checked={promptForm.is_template}
                      onCheckedChange={(checked: boolean) =>
                        setPromptForm((prev: CreatePromptInput) => ({ ...prev, is_template: checked }))
                      }
                    />
                    <Label htmlFor="template">Make this a template</Label>
                  </div>

                  {promptForm.is_template && (
                    <div>
                      <Label htmlFor="variables">Template Variables (comma-separated)</Label>
                      <Input
                        id="variables"
                        placeholder="variable1, variable2, variable3"
                        value={templateVariables}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateVariables(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag: Tag) => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedTags((prev: number[]) =>
                              prev.includes(tag.id)
                                ? prev.filter((id: number) => id !== tag.id)
                                : [...prev, tag.id]
                            );
                          }}
                          style={tag.color ? { backgroundColor: tag.color } : undefined}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : editingPrompt ? '💾 Update' : '➕ Create'}
                    </Button>
                    {editingPrompt && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setEditingPrompt(null);
                          resetPromptForm();
                        }}
                      >
                        ❌ Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Prompts List */}
            <div className="grid gap-4">
              {prompts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No prompts yet. Create your first prompt above! 🚀</p>
                  </CardContent>
                </Card>
              ) : (
                prompts.map((prompt: PromptWithTags) => (
                  <Card key={prompt.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {getTypeIcon(prompt.type)} {prompt.title}
                            {prompt.is_template && <Badge variant="secondary">📋 Template</Badge>}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${getTypeColor(prompt.type)}`}>
                              {prompt.type.toUpperCase()}
                            </span>
                            <span className="ml-2 text-gray-500">
                              Created: {prompt.created_at.toLocaleDateString()}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditPrompt(prompt)}
                          >
                            ✏️ Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">🗑️</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{prompt.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeletePrompt(prompt.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-gray-700 whitespace-pre-wrap">{prompt.content}</p>
                        </div>
                        
                        {prompt.template_variables && prompt.template_variables.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Template Variables:</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {prompt.template_variables.map((variable: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {prompt.tags.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Tags:</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {prompt.tags.map((tag: Tag) => (
                                <Badge 
                                  key={tag.id} 
                                  variant="secondary"
                                  style={tag.color ? { backgroundColor: tag.color } : undefined}
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Generator Tab */}
          <TabsContent value="generator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>⚡ Prompt Generator</CardTitle>
                <CardDescription>
                  Generate new prompts using templates and components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGeneratePrompt} className="space-y-4">
                  <div>
                    <Label htmlFor="template">Select Template</Label>
                    <Select
                      value={generatorForm.template_id > 0 ? generatorForm.template_id.toString() : ''}
                      onValueChange={(value: string) =>
                        setGeneratorForm((prev: GeneratePromptInput) => ({ ...prev, template_id: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template: PromptWithTags) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {getTypeIcon(template.type)} {template.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Available Components</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                      {promptComponents.map((component: PromptComponent) => (
                        <div
                          key={component.id}
                          className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                          onClick={() => {
                            const componentIds = generatorForm.component_ids || [];
                            const newIds = componentIds.includes(component.id)
                              ? componentIds.filter((id: number) => id !== component.id)
                              : [...componentIds, component.id];
                            setGeneratorForm((prev: GeneratePromptInput) => ({ ...prev, component_ids: newIds }));
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={(generatorForm.component_ids || []).includes(component.id)}
                            readOnly
                          />
                          <span className="text-sm">
                            {getTypeIcon(component.type)} {component.name} ({component.category})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading || generatorForm.template_id === 0}>
                    {isLoading ? 'Generating...' : '⚡ Generate Prompt'}
                  </Button>
                </form>

                {generatedPrompt && (
                  <div className="mt-6">
                    <Separator />
                    <div className="mt-4">
                      <Label className="text-lg font-semibold">Generated Prompt:</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                        <p className="whitespace-pre-wrap">{generatedPrompt}</p>
                      </div>
                      <Button
                        className="mt-2"
                        onClick={() => {
                          setPromptForm((prev: CreatePromptInput) => ({ ...prev, content: generatedPrompt }));
                          setActiveTab('prompts');
                        }}
                      >
                        📝 Use This Prompt
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🧩 Create Component</CardTitle>
                <CardDescription>
                  Create reusable prompt components for generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateComponent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="component-name">Name</Label>
                      <Input
                        id="component-name"
                        placeholder="Component name..."
                        value={componentForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setComponentForm((prev: CreatePromptComponentInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        placeholder="e.g., style, subject, mood"
                        value={componentForm.category}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setComponentForm((prev: CreatePromptComponentInput) => ({ ...prev, category: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="component-type">Type</Label>
                      <Select
                        value={componentForm.type || 'chatgpt'}
                        onValueChange={(value: 'chatgpt' | 'midjourney') =>
                          setComponentForm((prev: CreatePromptComponentInput) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chatgpt">🤖 ChatGPT</SelectItem>
                          <SelectItem value="midjourney">🎨 Midjourney</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="component-content">Content</Label>
                    <Textarea
                      id="component-content"
                      placeholder="Component content..."
                      value={componentForm.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setComponentForm((prev: CreatePromptComponentInput) => ({ ...prev, content: e.target.value }))
                      }
                      rows={4}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : '➕ Create Component'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Components List */}
            <div className="grid gap-4">
              {promptComponents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No components yet. Create your first component above! 🧩</p>
                  </CardContent>
                </Card>
              ) : (
                promptComponents.map((component: PromptComponent) => (
                  <Card key={component.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getTypeIcon(component.type)} {component.name}
                        <Badge variant="outline">{component.category}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{component.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🏷️ Create Tag</CardTitle>
                <CardDescription>
                  Create tags to organize your prompts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTag} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tag-name">Tag Name</Label>
                      <Input
                        id="tag-name"
                        placeholder="Enter tag name..."
                        value={tagForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTagForm((prev: CreateTagInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tag-color">Color (optional)</Label>
                      <Input
                        id="tag-color"
                        type="color"
                        value={tagForm.color || '#3b82f6'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setTagForm((prev: CreateTagInput) => ({ ...prev, color: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : '➕ Create Tag'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Tags List */}
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <Card className="w-full">
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">No tags yet. Create your first tag above! 🏷️</p>
                  </CardContent>
                </Card>
              ) : (
                tags.map((tag: Tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-sm px-3 py-1"
                    style={tag.color ? { backgroundColor: tag.color } : undefined}
                  >
                    {tag.name}
                  </Badge>
                ))
              )}
            </div>
          </TabsContent>

          {/* JSON Editor Tab */}
          <TabsContent value="json" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>💻 JSON Editor</CardTitle>
                <CardDescription>
                  Advanced prompt manipulation with JSON format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="json-input">JSON Data</Label>
                    <Textarea
                      id="json-input"
                      placeholder='{"title": "My Prompt", "content": "Your prompt content...", "type": "chatgpt"}'
                      value={jsonEditor}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonEditor(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          await trpc.validateJsonPrompt.mutate({ prompt_data: JSON.parse(jsonEditor) });
                          alert('✅ JSON is valid!');
                        } catch {
                          alert('❌ Invalid JSON format');
                        }
                      }}
                      variant="outline"
                    >
                      🔍 Validate JSON
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          await trpc.importJsonPrompt.mutate({
                            prompt_data: JSON.parse(jsonEditor)
                          });
                          alert('✅ Prompt imported successfully!');
                          loadPrompts();
                        } catch {
                          alert('❌ Failed to import prompt');
                        }
                      }}
                    >
                      📥 Import Prompt
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
