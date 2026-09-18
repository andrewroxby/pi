import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { Component, TUI } from "@earendil-works/pi-tui";
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

function settings(spacing: ToolShellSpacing) {
	return { getToolShellSpacingY: () => spacing };
}

function createTool(id: string): ToolExecutionComponent {
	return new ToolExecutionComponent(
		"test_tool",
		id,
		{},
		{},
		undefined,
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
		expect(resolveToolShellSpacingY(settings(0), transcript)).toBe(0);
		expect(resolveToolShellSpacingY(settings(1), transcript)).toBe(1);
	});

	test("separates a tool run from thinking or prose and groups consecutive tools", () => {
		const transcript: Component[] = [];
		expect(resolveToolShellSpacingY(settings("grouped"), transcript)).toBe(1);

		transcript.push(createTool("first"));
		expect(resolveToolShellSpacingY(settings("grouped"), transcript)).toBe(0);

		const toolOnlyAssistant = new AssistantMessageComponent(
			createAssistantMessage([{ type: "toolCall", id: "second", name: "test_tool", arguments: {} }]),
			true,
		);
		expect(toolOnlyAssistant.hasVisibleRows()).toBe(false);
		transcript.push(toolOnlyAssistant);
		expect(resolveToolShellSpacingY(settings("grouped"), transcript)).toBe(0);

		const thinkingAssistant = new AssistantMessageComponent(
			createAssistantMessage([
				{ type: "thinking", thinking: "reasoning" },
				{ type: "toolCall", id: "third", name: "test_tool", arguments: {} },
			]),
			true,
		);
		expect(thinkingAssistant.hasVisibleRows()).toBe(true);
		transcript.push(thinkingAssistant);
		expect(resolveToolShellSpacingY(settings("grouped"), transcript)).toBe(1);

		transcript.push(createTool("third"));
		expect(resolveToolShellSpacingY(settings("grouped"), transcript)).toBe(0);

		const proseAssistant = new AssistantMessageComponent(
			createAssistantMessage([
				{ type: "text", text: "explanation" },
				{ type: "toolCall", id: "fourth", name: "test_tool", arguments: {} },
			]),
			true,
		);
		expect(proseAssistant.hasVisibleRows()).toBe(true);
		transcript.push(proseAssistant);
		expect(resolveToolShellSpacingY(settings("grouped"), transcript)).toBe(1);
	});
});
