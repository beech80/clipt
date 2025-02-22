
import React from 'react';

interface Step {
  title: string;
  description: string;
}

interface StepsProps {
  steps: Step[];
}

export const Steps = ({ steps }: StepsProps) => {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary">
              <span className="text-sm font-medium">{index + 1}</span>
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-medium leading-none">{step.title}</h4>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
