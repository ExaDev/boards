import { GraphDescriptor } from "breadboard/packages/schema/src/graph";
import { BglContent, DirentWithUnknownContent } from "./index";

export function isBglContentFile<T extends DirentWithUnknownContent>(
	file: T
): file is BglContent<T> {
	return propIsBgl(file, "content");
}

export function isBglLike(json: Record<string, any>): json is GraphDescriptor {
	return Array.isArray(json.nodes) && Array.isArray(json.edges);
}

export function propIsBgl<T>(
	obj: T,
	prop: string
): obj is T & { [k in typeof prop]: GraphDescriptor } {
	return isBglLike(obj[prop]);
}
