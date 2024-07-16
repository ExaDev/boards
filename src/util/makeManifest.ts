import { BreadboardManifest } from "breadboard/packages/manifest/src";
import path from "path";
import { AbsoluteContentBgl } from "../types";
import { makeBoardReference } from "./makeBoardReference";

export function makeManifest({
	boardPathResolver = (file: AbsoluteContentBgl) =>
		path.join(file.parentPath, file.name),
	boardFiles = [],
	title = undefined,
	manifests = [],
	schemaUrl = undefined,
	reference = undefined,
}: {
	boardPathResolver?: (file: AbsoluteContentBgl) => string;
	boardFiles?: AbsoluteContentBgl[];
	title?: string;
	manifests?: BreadboardManifest[];
	schemaUrl?: string;
	reference?: string;
}): BreadboardManifest {
	return {
		$schema: schemaUrl,
		reference,
		title,
		manifests,
		boards: boardFiles.map(makeBoardReference(boardPathResolver)),
	};
}
