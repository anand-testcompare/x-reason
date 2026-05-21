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
    <div className={cn("w-full px-2 sm:px-3", className)}>
      <div className="flex items-start">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex shrink-0 flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
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
              <span className="mt-2 max-w-[100px] text-center text-xs">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 mt-5 h-0.5 min-w-0 flex-1 transition-colors",
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
