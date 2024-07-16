import { nonEmptyString } from "../nonEmptyString";
import { GitHubRepoData } from "../../types/GitHubRepoData";

export function makeRawGitHubUrl({
	org,
	repo,
	dir,
	file,
	ref = "main",
}: GitHubRepoData): string {
	return new URL(
		`https://raw.githubusercontent.com/${[org, repo, ref, dir, file]
			.filter(nonEmptyString)
			.join("/")}`
	).toString();
}
