"use client";

import { useCallback } from "react";
import {
  AIConfig,
  AIModel,
  AI_MODEL_OPTIONS,
  DEFAULT_MODEL,
} from "../../api/ai/providers";
import { cn } from "@/app/utils/cn";
import { ChevronDown } from "lucide-react";

interface AIProviderSelectorProps {
  config: AIConfig;
  onChange: (config: AIConfig) => void;
  className?: string;
}

export function AIProviderSelector({ config, onChange, className }: AIProviderSelectorProps) {
  const handleModelChange = useCallback((value: AIModel) => {
    const modelInfo = AI_MODEL_OPTIONS.find(option => option.model === value);
    if (!modelInfo) return;

    onChange({
      ...config,
      provider: modelInfo.provider,
      model: modelInfo.model,
    });
  }, [onChange, config]);

  const currentValue: AIModel = config.model || DEFAULT_MODEL;

  return (
    <div className={cn("relative", className)}>
      <select
        id="model-select"
        value={currentValue} 
        onChange={(event) => handleModelChange(event.target.value as AIModel)}
        className={cn(
          "h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-background py-0 pl-3 pr-8 text-xs leading-9 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {AI_MODEL_OPTIONS.map((option) => (
          <option key={option.model} value={option.model}>
            {option.name}
            {option.model === DEFAULT_MODEL ? " (Default)" : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
} 
