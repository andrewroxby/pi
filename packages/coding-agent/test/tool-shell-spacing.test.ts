import type { AssistantMessage } from "@earendil-works/pi-ai";
import { type Component, Text, type TUI } from "@earendil-works/pi-tui";
import { beforeAll, describe, expect, test } from "vitest";
import type { ToolShellSpacing } from "../src/core/settings-manager.ts";
import { AssistantMessageComponent } from "../src/modes/interactive/components/assistant-message.ts";
import { ToolExecutionComponent } from "../src/modes/interactive/components/tool-execution.ts";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";
import { resolveToolShellSpacingY } from "../src/modes/interactive/tool-shell-spacing.ts";

function createAssistantMessage(content: AssistantMessage["content"]): AssistantMessage {
	return {
		role: "assistant",
		content,
		api: "test-api",
		provider: "test-provider",
		model: "test-model",
		usage: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		},
		stopReason: "toolUse",
		timestamp: Date.now(),
	};
}

function settings(spacing: ToolShellSpacing, style: "box" | "row" = "box") {
	return { getToolShellSpacingY: () => spacing, getToolShellStyle: () => style };
}

function createTool(id: string, renderShell: "default" | "self" = "self"): ToolExecutionComponent {
	return new ToolExecutionComponent(
		"test_tool",
		id,
		{},
		{},
		{ renderShell, renderCall: () => new Text("call", 0, 0) },
		{ requestRender() {} } as unknown as TUI,
		process.cwd(),
	);
}

describe("resolveToolShellSpacingY", () => {
	beforeAll(() => {
		initTheme("dark");
	});

	test("preserves explicit uniform spacing modes", () => {
		const transcript: Component[] = [createTool("existing")];
		expect(resolveToolShellSpacingY(settings(0), transcript, { renderShell: "self" })).toBe(0);
		expect(resolveToolShellSpacingY(settings(1), transcript, { renderShell: "self" })).toBe(1);
	});

	test("groups default shells with everything else once they are framed as rows", () => {
		const transcript: Component[] = [createTool("self-first")];
		const rows = settings("grouped", "row");

		transcript.push(createTool("default-shell", "default"));
		expect(resolveToolShellSpacingY(rows, transcript, { renderShell: "default" })).toBe(0);
		expect(resolveToolShellSpacingY(rows, transcript, { renderShell: "self" })).toBe(0);
		expect(
			resolveToolShellSpacingY(settings("grouped", "box"), transcript, { renderShell: "self" }),
			"the box shell still earns its separator",
		).toBe(1);
	});

	test("keeps a blank row on both sides of a default tool shell", () => {
		const transcript: Component[] = [createTool("self-first")];

		expect(resolveToolShellSpacingY(settings("grouped"), transcript, { renderShell: "default" })).toBe(1);

		transcript.push(createTool("default-shell", "default"));
		expect(
			resolveToolShellSpacingY(settings("grouped"), transcript, { renderShell: "self" }),
			"a self-rendered tool after a default shell keeps the trailing row",
		).toBe(1);
		expect(resolveToolShellSpacingY(settings("grouped"), transcript, { renderShell: "default" })).toBe(1);

		transcript.push(createTool("self-after"));
		expect(resolveToolShellSpacingY(settings("grouped"), transcript, { renderShell: "self" })).toBe(0);
	});

	test("separates a tool run from thinking or prose and groups consecutive tools", () => {
		const transcript: Component[] = [];
		expect(resolveToolShellSpacingY(settings("grouped"), transcript, { renderShell: "self" })).toBe(1);

		transcript.push(createTool("first"));
		expect(resolveToolShellSpacingY(settings("grouped"), transcript, { renderShell: "self" })).toBe(0);

		const toolOnlyAssistant = new AssistantMessageComponent(
			createAssistantMessage([{ type: "toolCall", id: "second", name: "test_tool", arguments: {} }]),
			true,
		);
		expect(toolOnlyAssistant.hasVisibleRows()).toBe(false);
		transcript.push(toolOnlyAssistant);
		expect(resolveToolShellSpacingY(settings("grouped"), transcript, { renderShell: "self" })).toBe(0);

		const thinkingAssistant = new AssistantMessageComponent(
			createAssistantMessage([
				{ type: "thinking", thinking: "reasoning" },
				{ type: "toolCall", id: "third", name: "test_tool", arguments: {} },
			]),
			true,
		);
		expect(thinkingAssistant.hasVisibleRows()).toBe(true);
		transcript.push(thinkingAssistant);
		expect(resolveToolShellSpacingY(settings("grouped"), transcript, { renderShell: "self" })).toBe(1);

		transcript.push(createTool("third"));
		expect(resolveToolShellSpacingY(settings("grouped"), transcript, { renderShell: "self" })).toBe(0);

		const proseAssistant = new AssistantMessageComponent(
			createAssistantMessage([
				{ type: "text", text: "explanation" },
				{ type: "toolCall", id: "fourth", name: "test_tool", arguments: {} },
			]),
			true,
		);
		expect(proseAssistant.hasVisibleRows()).toBe(true);
		transcript.push(proseAssistant);
		expect(resolveToolShellSpacingY(settings("grouped"), transcript, { renderShell: "self" })).toBe(1);
	});
});
