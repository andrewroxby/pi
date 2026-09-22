import type { Component, TuiMouseEvent } from "@earendil-works/pi-tui";
import { describe, expect, test } from "vitest";
import { TOOL_ROW_PREFIX_WIDTH, ToolRowFrame } from "../src/modes/interactive/components/tool-row-frame.ts";

function createChild(lines: string[]): { component: Component; widths: number[]; events: TuiMouseEvent[] } {
	const widths: number[] = [];
	const events: TuiMouseEvent[] = [];
	return {
		widths,
		events,
		component: {
			render(width: number): string[] {
				widths.push(width);
				return lines;
			},
			handleMouse(event: TuiMouseEvent) {
				events.push(event);
				return { handled: true };
			},
			invalidate() {},
		},
	};
}

describe("ToolRowFrame", () => {
	test("marks the first line, indents the rest, and narrows the child", () => {
		const child = createChild(["first", "second"]);
		const frame = new ToolRowFrame(child.component, () => "  * ");

		expect(frame.render(40)).toEqual(["  * first", "    second"]);
		expect(child.widths).toEqual([40 - TOOL_ROW_PREFIX_WIDTH]);
	});

	test("re-reads the marker per frame so a row can change status", () => {
		let marker = "  a ";
		const child = createChild(["line"]);
		const frame = new ToolRowFrame(child.component, () => marker);

		expect(frame.render(20)[0]).toBe("  a line");
		marker = "  b ";
		expect(frame.render(20)[0]).toBe("  b line");
	});

	test("shifts mouse events by the prefix so click targets follow the content", () => {
		const child = createChild(["line"]);
		const frame = new ToolRowFrame(child.component, () => "  * ");
		const event = {
			type: "click",
			button: "left",
			x: 7,
			y: 0,
			screenX: 7,
			screenY: 0,
			width: 40,
			height: 1,
		} as TuiMouseEvent;

		frame.handleMouse(event);

		expect(child.events[0]?.x).toBe(7 - TOOL_ROW_PREFIX_WIDTH);
		expect(child.events[0]?.width).toBe(40 - TOOL_ROW_PREFIX_WIDTH);
		expect(child.events[0]?.screenX).toBe(7);
	});
});
