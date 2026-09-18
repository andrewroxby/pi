import type { Component } from "@earendil-works/pi-tui";
import type { ToolShellSpacing } from "../../core/settings-manager.ts";
import { AssistantMessageComponent } from "./components/assistant-message.ts";
import { ToolExecutionComponent } from "./components/tool-execution.ts";

interface ToolShellSpacingSettings {
	getToolShellSpacingY(): ToolShellSpacing;
}

/** Leading rows for a tool shell appended to the transcript now, under the configured spacing policy. */
export function resolveToolShellSpacingY(
	settings: ToolShellSpacingSettings,
	transcriptChildren: readonly Component[],
): 0 | 1 {
	const spacing = settings.getToolShellSpacingY();
	if (spacing !== "grouped") return spacing;

	for (let index = transcriptChildren.length - 1; index >= 0; index--) {
		const previous = transcriptChildren[index];
		// Pi inserts an assistant component before separately rendered tools. Ignore it
		// when a tool-only assistant message contributes no thinking or prose rows.
		if (previous instanceof AssistantMessageComponent && !previous.hasVisibleRows()) continue;
		return previous instanceof ToolExecutionComponent ? 0 : 1;
	}

	return 1;
}
