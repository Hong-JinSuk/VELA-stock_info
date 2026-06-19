'use client';

import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useIsMobile } from '@/hooks/use-mobile';
import PredictionForm from './components/predict-form';
import PredictionResult from './components/predict-result';

export default function Page() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        <PredictionForm />
        <PredictionResult />
      </div>
    );
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="flex-1 h-full min-h-0 gap-4"
    >
      <ResizablePanel
        defaultSize="380px"
        minSize="250px"
        maxSize="500px"
        className="flex flex-col"
      >
        <PredictionForm />
      </ResizablePanel>

      <ResizablePanel className="flex flex-col">
        <PredictionResult />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
