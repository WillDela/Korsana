import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ArtifactRenderer from './ArtifactRenderer';

describe('ArtifactRenderer', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders a safe fallback for malformed artifact payloads', () => {
    const markup = renderToStaticMarkup(
      <ArtifactRenderer
        artifact={{
          type: 'race_strategy',
          data: '{"headline":"Broken"',
        }}
      />,
    );

    expect(markup).toContain('Race Strategy unavailable');
    expect(markup).toContain('could not safely render this coach artifact');
  });

  it('renders the race strategy artifact card', () => {
    const markup = renderToStaticMarkup(
      <ArtifactRenderer
        artifact={{
          type: 'race_strategy',
          data: {
            headline: 'Run patient through halfway, then press late.',
            target_pace: '9:10/mi',
            phases: [
              { phase: 'Start', guidance: 'Stay smooth and controlled.' },
              { phase: 'Finish', guidance: 'Only squeeze once you are settled.' },
            ],
            key_reminders: ['Fuel at 30 minutes', 'Do not chase surges'],
          },
        }}
      />,
    );

    expect(markup).toContain('Race Strategy');
    expect(markup).toContain('Run patient through halfway, then press late.');
    expect(markup).toContain('9:10/mi');
    expect(markup).toContain('Race Breakdown');
    expect(markup).toContain('Fuel at 30 minutes');
  });
});
