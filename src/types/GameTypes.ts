export interface IGame {
    _id: string;
    date: Date;
    seasonId: string;
    team: ITeamGameTeam; // create type
    opponentTeam: IOpponentGameTeam; // create type
    score: IGameScore; // create type
    type: GameType;
}

/**
 * Team which is creating the game
 */
export interface ITeamGameTeam {
    id: string;
    roster: IGamePlayer[];
    goals: IGameTeamGoals[];
    penalties: IGameTeamPenalty[];
}

export interface IOpponentGameTeam {
    name: string;
    goals: IGameOpponentGoals[]; // creat type
    penalties: IGameOpponentPenalty[]; // create type
}

export interface IGamePlayer {
    playerId: string;
    teamId: string;
    stats: IGamePlayerStats;
}

export interface IGamePlayerStats {
    goals: number;
    assists: number;
    pims: number;
}

export interface IGameTeamGoals extends IBaseGameStat {
    scoredBy: string; // playerId
    assist1: string; // playerId
    assist2: string; // playerId
    type: GoalTypes;
}

export interface IGameOpponentGoals extends IBaseGameStat {
    name: string; // name of player
    type: GoalTypes;
}

export interface IGameTeamPenalty extends IBaseGameStat {
    playerId: string;
    type: PenaltyType;
    duration: number; // in minutes
}

export interface IGameOpponentPenalty extends IBaseGameStat {
    name: string; // name of player
    type: PenaltyType;
    duration: number; // in minutes
}

export interface IBaseGameStat {
    minute: number;
    second: number;
}

export interface IGameScore {
    team: number;
    opponent: number;
    periods: IGamePeriodScore[];
}

export interface IGamePeriodScore {
    number: number;
    team: number;
    opponent: number;
}

export interface IGamePostBody {
    date: string; // date in ISO format;
    team: string;
    teamRoster: string[];
    opponentName: string;
    seasonId: string;
    type: GameType;
}

export interface IAddGoalBody {
    minute: number;
    second: number;
    type: GoalTypes;
    scoredBy: string; // playerId
    assist1: string; // playerId
    assist2: string; // playerId
}

type GoalTypes = 'EVEN' | 'SH' | 'PP';
type GameType = 'CHALLENGE' | 'LLHIC' | 'BOTBC';

export type PenaltyType =
    | 'ABUSE' // Abuse of officials
    | 'AGGR' // Aggressor penalty
    | 'BDYCH' // Body checking
    | 'BOARD' // Boarding
    | 'CHARG' // Charging
    | 'CHECK' // Checking
    | 'CHEB' // Checking from behind
    | 'DELAY' // Delay of game
    | 'ELBOW' // Elbowing
    | 'EMBEL' // Embellishment
    | 'FIGHT' // Fighting
    | 'GOALINTRF' // Goaltender interference
    | 'HIST' // High sticking
    | 'HOLD' // Holding
    | 'HOST' // Holding the stick
    | 'HOOK' // Hooking
    | 'ILLEQUIP' // Illegal equipment
    | 'INTRF' // Interference
    | 'KICK' // Kicking
    | 'KNEE' // Kneeing
    | 'MATCH' // Match penalty (e.g. intent to injure)
    | 'MISC' // Misconduct
    | 'RETAL' // Retaliation
    | 'ROUGH' // Roughing
    | 'SLASH' // Slashing
    | 'SPEAR' // Spearing
    | 'THROWSTICK' // Throwing the stick
    | 'TOOM' // Too many men on the ice
    | 'TRIP' // Tripping
    | 'UNSP'; // Unsportsmanlike conduct
