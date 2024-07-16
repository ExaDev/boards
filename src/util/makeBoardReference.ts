import { ResourceReference } from "breadboard/packages/manifest/src";
import { AbsoluteContentBgl } from "../types";

export function makeBoardReference(
	pathResolver: (file: AbsoluteContentBgl) => string
): (
	value: AbsoluteContentBgl,
	index: number,
	array: AbsoluteContentBgl[]
) => ResourceReference {
	return (file: AbsoluteContentBgl) =>
		({
			reference: pathResolver(file),
			title: file.content.title || file.name,
		}) satisfies ResourceReference;
}
