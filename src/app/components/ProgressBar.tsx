'use client'

import React from 'react'
import { cn } from '@/app/utils/cn'

interface Step {
  id: string
  label: string
}

interface ProgressBarProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className="mt-2 text-xs text-center max-w-[100px]">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 transition-colors",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}