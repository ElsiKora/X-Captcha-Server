import type { Challenge } from "../entity/challenge.entity";

import type { IChallengeSolutionClick } from "./solution-click.interface";
import type { IChallengeSolutionPow } from "./solution-pow.interface";

export interface IChallengeSolveProperties {
	challenge: Challenge;
	solution: IChallengeSolutionClick | IChallengeSolutionPow;
}
