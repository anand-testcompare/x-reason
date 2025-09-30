"use client";

import { useCallback } from "react";
import {
  AIConfig,
  OpenAIModel,
  GeminiModel,
  XAIModel,
  OPENAI_MODELS as OPENAI_MODELS_CONFIG,
  GEMINI_MODELS as GEMINI_MODELS_CONFIG,
  XAI_MODELS as XAI_MODELS_CONFIG,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_XAI_MODEL,
} from "../../api/ai/providers";
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

// Order OpenAI models with GPT OSS 120B first
const OPENAI_MODELS: OpenAIModel[] = [
  'openai/gpt-oss-120b',
  'openai/gpt-4o-mini', 
  'openai/gpt-5-nano',
  'openai/gpt-4.1-nano'
];
const GEMINI_MODELS = Object.keys(GEMINI_MODELS_CONFIG) as GeminiModel[];
const XAI_MODELS = Object.keys(XAI_MODELS_CONFIG) as XAIModel[];

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
    const [provider, ...modelParts] = value.split(':');
    const model = modelParts.join(':'); // Handle model names with colons
    onChange({
      ...config,
      provider: provider as AIConfig['provider'],
      model: model as OpenAIModel | GeminiModel | XAIModel
    });
  }, [onChange, config]);

  const getDefaultModel = () => {
    switch (config.provider) {
      case 'openai':
        return DEFAULT_OPENAI_MODEL;
      case 'gemini':
        return DEFAULT_GEMINI_MODEL;
      case 'xai':
        return DEFAULT_XAI_MODEL;
      default:
        return DEFAULT_OPENAI_MODEL; // Primary default is now OpenAI
    }
  };

  const currentModel = config.model || getDefaultModel();
  const currentValue = `${config.provider}:${currentModel}`;

  const showGemini = availableProviders.includes('gemini');
  const showOpenAI = availableProviders.includes('openai');
  const showXAI = availableProviders.includes('xai');

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
          {showOpenAI && (
            <>
              <SelectGroup>
                <SelectLabel>OpenAI GPT (Primary)</SelectLabel>
                {OPENAI_MODELS.map((model) => (
                  <SelectItem key={`openai:${model}`} value={`openai:${model}`}>
                    {OPENAI_MODELS_CONFIG[model].name}
                    {model === DEFAULT_OPENAI_MODEL ? ' (Primary Default)' : ''}
                  </SelectItem>
                ))}
              </SelectGroup>
              {(showXAI || showGemini) && <SelectSeparator />}
            </>
          )}
          {showXAI && (
            <>
              <SelectGroup>
                <SelectLabel>X.AI (Grok)</SelectLabel>
                {XAI_MODELS.map((model) => (
                  <SelectItem key={`xai:${model}`} value={`xai:${model}`}>
                    {XAI_MODELS_CONFIG[model].name}
                    {model === DEFAULT_XAI_MODEL ? ' (Default)' : ''}
                  </SelectItem>
                ))}
              </SelectGroup>
              {showGemini && <SelectSeparator />}
            </>
          )}
          {showGemini && (
            <SelectGroup>
              <SelectLabel>Google Gemini</SelectLabel>
              {GEMINI_MODELS.map((model) => (
                <SelectItem key={`gemini:${model}`} value={`gemini:${model}`}>
                  {GEMINI_MODELS_CONFIG[model].name}
                  {model === DEFAULT_GEMINI_MODEL ? ' (Default)' : ''}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
} 