import { nonEmptyString } from "../nonEmptyString";
import { GitHubRepoData } from "../../types/GitHubRepoData";

export function makeGitHubIoUrl({
	org,
	repo = "",
	dir,
	file,
}: GitHubRepoData): string {
	return new URL(
		`https://${org.toLowerCase()}.github.io/${[repo, dir, file]
			.filter(nonEmptyString)
			.join("/")}`
	).toString();
}
