'use client';

import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import PredictionForm from './components/predict-form';
import PredictionResult from './components/predict-result';

export default function Page() {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="flex-1 h-full min-h-0 gap-4"
    >
      <ResizablePanel
        defaultSize="380px"
        minSize="250px"
        className="flex flex-col"
      >
        <PredictionForm />
      </ResizablePanel>

      {/* <ResizableHandle /> */}

      <ResizablePanel className="flex flex-col">
        <PredictionResult />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
