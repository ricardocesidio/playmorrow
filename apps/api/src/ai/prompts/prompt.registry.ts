import { Injectable } from '@nestjs/common';

export interface PromptTemplate {
  name: string;
  version: number;
  systemPrompt: string;
  template: string;
  variables: string[];
  description?: string;
  createdAt?: Date;
}

@Injectable()
export class PromptRegistry {
  private templates = new Map<string, PromptTemplate[]>();

  register(template: PromptTemplate): void {
    const versions = this.templates.get(template.name) ?? [];

    const existing = versions.find((v) => v.version === template.version);
    if (existing) {
      throw new Error(
        `Prompt "${template.name}" v${template.version} already registered`,
      );
    }

    const entry: PromptTemplate = {
      ...template,
      createdAt: template.createdAt ?? new Date(),
    };

    versions.push(entry);
    versions.sort((a, b) => a.version - b.version);
    this.templates.set(template.name, versions);
  }

  registerBuiltInPrompts(): void {
    const prompts: PromptTemplate[] = [
      {
        name: 'search-assistant',
        version: 1,
        systemPrompt:
          'You are a helpful assistant for Playmorrow, a game platform. Answer questions about games, studios, features, and community.',
        template:
          'User query: {{query}}\n\nSearch results: {{results}}\n\nProvide a helpful response based on the search results.',
        variables: ['query', 'results'],
        description: 'Default search assistant for platform-wide queries',
      },
      {
        name: 'game-description',
        version: 1,
        systemPrompt:
          'You are a game narrative designer. Write compelling game descriptions.',
        template:
          'Title: {{title}}\nGenre: {{genre}}\nStudio: {{studio}}\nFeatures: {{features}}\n\nWrite a store description.',
        variables: ['title', 'genre', 'studio', 'features'],
        description: 'Generate game store descriptions',
      },
    ];

    for (const prompt of prompts) {
      this.register(prompt);
    }
  }

  getLatest(name: string): PromptTemplate {
    const versions = this.templates.get(name);
    if (!versions || versions.length === 0) {
      throw new Error(`Prompt "${name}" is not registered`);
    }
    return versions[versions.length - 1];
  }

  getVersion(name: string, version: number): PromptTemplate {
    const versions = this.templates.get(name);
    if (!versions || versions.length === 0) {
      throw new Error(`Prompt "${name}" is not registered`);
    }
    const match = versions.find((v) => v.version === version);
    if (!match) {
      throw new Error(`Prompt "${name}" version ${version} not found`);
    }
    return match;
  }

  getVersions(name: string): PromptTemplate[] {
    const versions = this.templates.get(name);
    if (!versions || versions.length === 0) {
      throw new Error(`Prompt "${name}" is not registered`);
    }
    return [...versions];
  }

  resolve(
    name: string,
    variables: Record<string, string>,
    version?: number,
  ): string {
    const tmpl = version !== undefined
      ? this.getVersion(name, version)
      : this.getLatest(name);
    return this.interpolate(tmpl.template, variables);
  }

  resolveSystem(
    name: string,
    variables: Record<string, string>,
    version?: number,
  ): string {
    const tmpl = version !== undefined
      ? this.getVersion(name, version)
      : this.getLatest(name);
    return this.interpolate(tmpl.systemPrompt, variables);
  }

  private interpolate(
    template: string,
    variables: Record<string, string>,
  ): string {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
      const value = variables[key];
      if (value === undefined) {
        throw new Error(`Missing variable "{{${key}}}" in prompt template`);
      }
      return value;
    });
  }

  validate(name: string, variables: Record<string, string>): string[] {
    const tmpl = this.getLatest(name);
    return tmpl.variables.filter((v) => !(v in variables));
  }

  listAll(): PromptTemplate[] {
    const all: PromptTemplate[] = [];
    for (const versions of this.templates.values()) {
      all.push(...versions);
    }
    return all;
  }
}
