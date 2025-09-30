"use client";

import { useCallback } from "react";
import { AIConfig, OpenAIModel, GeminiModel } from "../../api/ai/providers";
import { useCredentials } from "../../context/CredentialsContext";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

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
  const { availableProviders } = useCredentials();
  
  const handleModelChange = useCallback((value: string) => {
    const [provider, model] = value.split(':');
    onChange({
      ...config,
      provider: provider as AIConfig['provider'],
      model: model as OpenAIModel | GeminiModel
    });
  }, [onChange, config]);

  const getDefaultModel = () => {
    return config.provider === 'openai' ? 'gpt-4.1-nano' : 'gemini-2.0-flash';
  };

  const currentModel = config.model || getDefaultModel();
  const currentValue = `${config.provider}:${currentModel}`;

  const showGemini = availableProviders.includes('gemini');
  const showOpenAI = availableProviders.includes('openai');

  return (
    <div className={className || ''}>
      <Select 
        value={currentValue} 
        onValueChange={handleModelChange}
      >
        <SelectTrigger id="model-select" className="h-7 text-xs">
          <SelectValue placeholder="Select AI Model" />
        </SelectTrigger>
        <SelectContent style={selectContentStyle}>
          {showGemini && (
            <>
              <SelectGroup>
                <SelectLabel>Google Gemini</SelectLabel>
                {GEMINI_MODELS.map((model) => (
                  <SelectItem key={`gemini:${model}`} value={`gemini:${model}`}>
                    {model}
                    {model === 'gemini-2.0-flash' ? ' (Default)' : ''}
                  </SelectItem>
                ))}
              </SelectGroup>
              {showOpenAI && <SelectSeparator />}
            </>
          )}
          {showOpenAI && (
            <SelectGroup>
              <SelectLabel>OpenAI GPT</SelectLabel>
              {OPENAI_MODELS.map((model) => (
                <SelectItem key={`openai:${model}`} value={`openai:${model}`}>
                  {model}
                  {model === 'gpt-4.1-nano' ? ' (Default)' : ''}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
} 