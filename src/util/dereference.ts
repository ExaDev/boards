import {
	BoardReference,
	BreadboardManifest,
	Reference,
} from "breadboard/packages/manifest/src";
import { isBglLike } from "../types";

type ManifestReference = Pick<BreadboardManifest, "reference">;

function isDereferencedManifest(obj: any): obj is BreadboardManifest {
	return (
		("boards" in obj && Array.isArray(obj.boards)) ||
		("manifests" in obj && Array.isArray(obj.manifests))
	);
}
function isManifestReference(obj: any): obj is ManifestReference {
	return (
		"reference" in obj &&
		typeof obj.reference === "string" &&
		!("boards" in obj) &&
		!("manifests" in obj)
	);
}
function manifestHasManifestReferences(
	obj: any
): obj is BreadboardManifest & { manifests: BreadboardManifest[] } {
	return (
		"manifests" in obj &&
		Array.isArray(obj.manifests) &&
		obj.manifests.some(isManifestReference)
	);
}

function isBoardReference(obj: any): obj is BoardReference {
	return (
		!("nodes" in obj) &&
		!("edges" in obj) &&
		("url" in obj || "reference" in obj)
	);
}

export async function dereferenceManifest(
	manifest: BreadboardManifest,
	maxDepth: number = Infinity,
	currentDepth: number = 0
): Promise<BreadboardManifest> {
	console.debug({
		currentDepth,
		maxDepth,
	});

	if (currentDepth >= maxDepth) {
		return manifest;
	}

	if (manifestHasBoardReferences(manifest)) {
		for (let i = 0; i < manifest.boards.length; i++) {
			const board = manifest.boards[i];
			if (!hasReference(board) && !isBglLike(board)) {
				throw new Error(`Item is not a reference or a board ${board}`);
			}
			if (hasReference(board)) {
				const referenceKey = "reference" in board ? "reference" : "url";
				const reference = resolveReferenceIfRelative(
					manifest.reference,
					board[referenceKey]
				);
				if (!isBglLike(board)) {
					const response = await fetch(reference);
					const data = await response.json();
					if (!isBglLike(data)) {
						throw new Error("Invalid board data");
					}
					for (const key in data) {
						board[key] = data[key];
					}
					board["reference"] = undefined;
					board["url"] = reference;
				}
			}
			if (!isBglLike(board)) {
				throw new Error(`Invalid board: ${board}`);
			}
			manifest.boards[i] = board;
		}
	}
	if (manifestHasManifestReferences(manifest)) {
		for (let i = 0; i < manifest.manifests.length; i++) {
			const childManifest = manifest.manifests[i];
			if (
				!hasReference(childManifest) &&
				!isDereferencedManifest(childManifest)
			) {
			}
			const referenceKey = "reference" in childManifest ? "reference" : "url";
			const reference = resolveReferenceIfRelative(
				manifest.reference,
				childManifest[referenceKey]
			);
			if (hasReference(childManifest)) {
				const response = await fetch(reference);
				const data = await response.json();
				if (!isDereferencedManifest(data)) {
					throw new Error("Invalid manifest data");
				}
				for (const key in data) {
					childManifest[key] = data[key];
				}
				childManifest[referenceKey] = reference;
			}
			if (!isDereferencedManifest(childManifest)) {
				throw new Error(`Invalid manifest: ${childManifest}`);
			}
		}
	}
	for (let i = 0; i < manifest.manifests.length; i++) {
		let childManifest = manifest.manifests[i];
		(childManifest as object)["reference"] ??= manifest.reference;
		manifest.manifests[i] = await dereferenceManifest(
			{ boards: [], manifests: [], ...childManifest },
			maxDepth,
			currentDepth + 1
		);
	}
	return manifest;
}

function resolveRelativeReference(
	parent: Reference,
	child: Reference
): Reference {
	try {
		const parentUrl = new URL(parent);
		const childUrl = new URL(child, parentUrl);
		return childUrl.href;
	} catch (error) {
		console.error({ error, parent, child });
		throw error;
	}
}

function isRelativeReference(reference: string): boolean {
	return !reference.includes("://");
}

function manifestHasBoardReferences(manifest: BreadboardManifest) {
	return (
		"boards" in manifest &&
		Array.isArray(manifest.boards) &&
		manifest.boards.some(isBoardReference)
	);
}

function resolveReferenceIfRelative(
	parent: Reference,
	child: Reference
): Reference {
	if (isRelativeReference(child)) {
		return resolveRelativeReference(parent, child);
	}
	return child;
}

function hasReference(obj: object): boolean {
	if (!("reference" in obj) && !("url" in obj)) {
		return false;
	}
	const key = "reference" in obj ? "reference" : "url";
	return typeof obj[key] === "string";
}
