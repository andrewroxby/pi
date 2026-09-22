import type { Component, TuiMouseEvent, TuiMouseEventResult } from "@earendil-works/pi-tui";

/** Two spaces, a marker glyph, and a space. */
export const TOOL_ROW_PREFIX_WIDTH = 4;

const CONTINUATION = " ".repeat(TOOL_ROW_PREFIX_WIDTH);

/**
 * Frames a default tool shell's content as a transcript row: a marker on the
 * first line, an aligned indent on the rest. The child renders into the
 * narrowed width, so a framed line still fits the terminal.
 */
export class ToolRowFrame implements Component {
	private readonly child: Component;
	private readonly marker: () => string;

	constructor(child: Component, marker: () => string) {
		this.child = child;
		this.marker = marker;
	}

	render(width: number): string[] {
		const innerWidth = Math.max(1, width - TOOL_ROW_PREFIX_WIDTH);
		return this.child.render(innerWidth).map((line, index) => (index === 0 ? this.marker() : CONTINUATION) + line);
	}

	// Screen coordinates pass through untouched, so a nested container still
	// derives its child's true origin from them and later events retarget there.
	handleMouse(event: TuiMouseEvent): TuiMouseEventResult | undefined {
		return this.child.handleMouse?.({
			...event,
			x: event.x - TOOL_ROW_PREFIX_WIDTH,
			width: Math.max(1, event.width - TOOL_ROW_PREFIX_WIDTH),
		});
	}

	invalidate(): void {
		this.child.invalidate();
	}
}
