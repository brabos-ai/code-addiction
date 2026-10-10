// The states components (plan F3, L3.5). RED-FIRST for the Bash-free error copy:
// the board reads through the Node core now, so no panel may send a reader to
// install bash or to look for backlog.sh — advice for an architecture this
// delivery deleted.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EmptyBoard, ErrorPanel, HealthBanner } from '@/components/states';
import type { BoardData } from '@/api/types';

// These panels are rendered directly, so each render is its own document.
// Without this the previous test's DOM is still mounted and every role query
// below matches two nodes instead of one.
afterEach(() => cleanup());

const data = {
  present: true,
  statuses: [],
  columns: [],
  tickets: [],
  damagedLines: [],
  undefinedStatuses: [],
  readAt: '2026-10-03T00:00:00Z',
} as unknown as BoardData;

/**
 * Advice that belonged to the shell-backed board. Each phrase sent a reader to
 * fix an interpreter or a script path that this delivery removed, so each one
 * appearing in any panel is a regression rather than a cosmetic leftover.
 */
const SHELL_ADVICE = [
  /bash/i,
  /git bash/i,
  /backlog\.sh/,
  /--scripts/,
  /\.codeadd\/scripts/,
  /on this machine.s PATH/i,
];

function panelText(): string {
  return screen.getByRole('alert').textContent ?? '';
}

describe('ErrorPanel', () => {
  it('L3.5a describes a data-read failure in terms of the data, not the shell', () => {
    render(<ErrorPanel error={{ error: 'backlog-read-failed' }} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('The backlog could not be read')).toBeInTheDocument();
    expect(panelText()).toMatch(/docs\/backlog\.jsonl/);
  });

  it('L3.5b carries no bash-install or script-path advice for any served error', () => {
    // The names board/server.mjs can actually answer with. Each is rendered, and
    // each must stay free of the interpreter advice the shell board needed.
    for (const error of ['backlog-read-failed', 'not-found', 'host-not-allowed', 'method-not-allowed']) {
      const { unmount } = render(<ErrorPanel error={{ error }} />);
      const text = panelText();
      for (const advice of SHELL_ADVICE) expect(text).not.toMatch(advice);
      unmount();
    }
  });

  it('L3.5c keeps the shell words out of the fallback copy too', () => {
    render(<ErrorPanel error={{ error: 'something-new-from-the-server' }} />);
    expect(screen.getByText('The board could not be read')).toBeInTheDocument();
    for (const advice of SHELL_ADVICE) expect(panelText()).not.toMatch(advice);
  });

  it('renders the server detail when one is supplied, and omits the block when not', () => {
    const { unmount } = render(<ErrorPanel error={{ error: 'backlog-read-failed', detail: 'EACCES: permission denied' }} />);
    expect(screen.getByText('EACCES: permission denied')).toBeInTheDocument();
    unmount();

    render(<ErrorPanel error={{ error: 'backlog-read-failed' }} />);
    expect(document.querySelector('pre')).toBeNull();
  });
});

describe('HealthBanner', () => {
  it('L3.5d names the damaged line numbers and the undefined statuses', () => {
    render(<HealthBanner data={{ ...data, damagedLines: [2, 5], undefinedStatuses: ['blocked'] }} />);
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Lines 2, 5');
    // One damaged line reads in the singular; two do not.
    expect(banner).toHaveTextContent('are left out');
    expect(banner).toHaveTextContent('“blocked”');
    expect(banner).toHaveTextContent('docs/backlog.definitions.json');
  });

  it('L3.5e renders nothing for a clean board', () => {
    const { container } = render(<HealthBanner data={data} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('L3.5f uses the singular for exactly one damaged line', () => {
    render(<HealthBanner data={{ ...data, damagedLines: [4] }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Line 4 of docs/backlog.jsonl could not be read and is left out');
  });
});

describe('EmptyBoard', () => {
  it('L3.5g points at docs/backlog.jsonl and never at a script to run', () => {
    render(<EmptyBoard />);
    expect(screen.getByText(/docs\/backlog\.jsonl/)).toBeInTheDocument();
    for (const advice of SHELL_ADVICE) {
      expect(document.body.textContent ?? '').not.toMatch(advice);
    }
  });
});

describe('ErrorPanel — a board that is not ready', () => {
  const STATES = ['none', 'migration-required', 'branch-missing', 'checkout-missing', 'unavailable'];

  it('F25 names the state, in plain words, for every state the server can answer', () => {
    for (const state of STATES) {
      const { unmount } = render(<ErrorPanel error={{ error: `board-${state}`, state }} />);
      const text = panelText();
      expect(text, state).toContain(`State: ${state}`);
      expect(text, state).not.toContain('The board could not be read');
      for (const advice of SHELL_ADVICE) expect(text, state).not.toMatch(advice);
      unmount();
    }
  });

  it('F25 says "board clone", not the project selected with --root, for a failed read and the empty board', () => {
    render(<ErrorPanel error={{ error: 'backlog-read-failed' }} />);
    expect(panelText()).toMatch(/board clone/);
    expect(panelText()).not.toMatch(/selected with --root/);
    cleanup();
    render(<EmptyBoard />);
    expect(document.body.textContent ?? '').toMatch(/board clone/);
  });
});
