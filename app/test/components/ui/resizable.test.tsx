import { render } from '@testing-library/react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/shared/ui/resizable';

describe('Resizable', () => {
  test('renders handle with and without grip', () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>Left</ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>Right</ResizablePanel>
        <ResizableHandle />
      </ResizablePanelGroup>
    );
  });
});
