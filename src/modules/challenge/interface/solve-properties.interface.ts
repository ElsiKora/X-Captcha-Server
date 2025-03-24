import type { Challenge } from "../entity/challenge.entity";

export interface IChallengeSolveProperties {
	challenge: Challenge;
	solution: string;
}
