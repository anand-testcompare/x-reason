"use client";

import { useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator, SelectLabel, SelectGroup } from "./select";
import { Label } from "./label";
import { AIConfig, OpenAIModel, GeminiModel } from "../../api/ai/providers";

interface AIProviderSelectorProps {
  config: AIConfig;
  onChange: (config: AIConfig) => void;
  className?: string;
}

const OPENAI_MODELS: OpenAIModel[] = ['o4-mini', 'o3-mini', 'gpt-4.1-mini', 'gpt-4.1-nano'];
const GEMINI_MODELS: GeminiModel[] = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'];

// Force readable styles
const selectContentStyle = {
  backgroundColor: '#f9fafb',
  color: '#1f2937',
  border: '1px solid #d1d5db',
  opacity: 1,
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none'
};

export function AIProviderSelector({ config, onChange, className }: AIProviderSelectorProps) {
  const handleModelChange = useCallback((value: string) => {
    const [provider, model] = value.split(':');
    onChange({
      provider: provider as AIConfig['provider'],
      model: model as OpenAIModel | GeminiModel
    });
  }, [onChange]);

  const getDefaultModel = () => {
    return config.provider === 'openai' ? 'o4-mini' : 'gemini-2.0-flash';
  };

  const currentModel = config.model || getDefaultModel();
  const currentValue = `${config.provider}:${currentModel}`;

  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Label htmlFor="model-select">AI Model</Label>
      <Select 
        value={currentValue} 
        onValueChange={handleModelChange}
      >
        <SelectTrigger id="model-select">
          <SelectValue placeholder="Select AI Model" />
        </SelectTrigger>
        <SelectContent style={selectContentStyle}>
          <SelectGroup>
            <SelectLabel>Google Gemini</SelectLabel>
            {GEMINI_MODELS.map((model) => (
              <SelectItem key={`gemini:${model}`} value={`gemini:${model}`}>
                {model}
                {model === 'gemini-2.0-flash' ? ' (Default)' : ''}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>OpenAI GPT</SelectLabel>
            {OPENAI_MODELS.map((model) => (
              <SelectItem key={`openai:${model}`} value={`openai:${model}`}>
                {model}
                {model === 'o4-mini' ? ' (Default)' : ''}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
} 