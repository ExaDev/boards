import {
	BoardReference,
	BreadboardManifest,
	Reference,
} from "breadboard/packages/manifest/src";
import { isBglLike } from "../types";

type ManifestReference = Pick<BreadboardManifest, "reference">;

function isDereferencedManifest(obj: object): obj is BreadboardManifest {
	return (
		("boards" in obj && Array.isArray(obj.boards)) ||
		("manifests" in obj && Array.isArray(obj.manifests))
	);
}

function isManifestReference(obj: object): obj is ManifestReference {
	return (
		"reference" in obj &&
		typeof obj.reference === "string" &&
		!("boards" in obj) &&
		!("manifests" in obj)
	);
}

function manifestHasManifestReferences(
	obj: object
): obj is BreadboardManifest & { manifests: BreadboardManifest[] } {
	return (
		"manifests" in obj &&
		Array.isArray(obj.manifests) &&
		obj.manifests.some(isManifestReference)
	);
}

function isBoardReference(obj: object): obj is BoardReference {
	return (
		!("nodes" in obj) &&
		!("edges" in obj) &&
		("url" in obj || "reference" in obj)
	);
}

async function dereferenceBoard(
	board: BoardReference,
	parentReference: Reference
): Promise<BoardReference> {
	if (!hasReference(board) && !isBglLike(board)) {
		throw new Error(`Item is not a reference or a board ${board}`);
	}
	if (hasReference(board)) {
		const referenceKey = "reference" in board ? "reference" : "url";
		const reference = resolveReferenceIfRelative(
			parentReference,
			board[referenceKey]
		);
		const response = await fetch(reference);
		const data = await response.json();
		if (!isBglLike(data)) {
			throw new Error("Invalid board data");
		}
		return { ...data, url: reference, reference: undefined };
	}
	return board;
}

async function resolveManifestReference(
	manifestReference: ManifestReference,
	parentReference: Reference
): Promise<ManifestReference> {
	const referenceKey = "reference" in manifestReference ? "reference" : "url";
	const reference = resolveReferenceIfRelative(
		parentReference,
		manifestReference[referenceKey]
	);
	const response = await fetch(reference);
	const data = await response.json();
	if (!isDereferencedManifest(data)) {
		throw new Error("Invalid manifest data");
	}
	return { ...data, [referenceKey]: reference };
}

export async function dereferenceManifest(
	manifest: BreadboardManifest,
	maxDepth: number = Infinity,
	currentDepth: number = 0
): Promise<BreadboardManifest> {
	console.debug({ currentDepth, maxDepth });

	if (currentDepth >= maxDepth) {
		return manifest;
	}

	if (manifestHasBoardReferences(manifest)) {
		manifest.boards = await Promise.all(
			manifest.boards.map((board) =>
				dereferenceBoard(board, manifest.reference)
			)
		);
	}

	if (manifestHasManifestReferences(manifest)) {
		manifest.manifests = await Promise.all(
			manifest.manifests.map((manifestReference) =>
				resolveManifestReference(manifestReference, manifest.reference)
			)
		);
	}
	if (!(Array.isArray(manifest.manifests) && manifest.manifests.length)) {
		manifest.manifests = [];
	}
	if (!(Array.isArray(manifest.boards) && manifest.boards.length)) {
		manifest.boards = [];
	}

	manifest.manifests = await Promise.all(
		manifest.manifests.map(async (childManifest) =>
			dereferenceManifest(
				{
					...childManifest,
					reference: childManifest.reference ?? manifest.reference,
				},
				maxDepth,
				currentDepth + 1
			)
		)
	);

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

function manifestHasBoardReferences(manifest: BreadboardManifest): boolean {
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
