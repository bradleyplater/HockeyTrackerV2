export interface Game {
    _id: string;
    date: Date;
    team: TeamGameTeam; // create type
    opponentTeam: OpponentGameTeam; // create type
    score: GameScore; // create type
}

/**
 * Team which is creating the game
 */
export interface TeamGameTeam {
    id: string;
    roster: GamePlayer[];
    goals: GameTeamGoals[];
    penalties: GameTeamPenalty[];
}

export interface OpponentGameTeam {
    name: string;
    goals: GameOpponentGoals[]; // creat type
    penalties: GameOpponentPenalty[]; // create type
}

export interface GamePlayer {
    playerId: string;
    teamId: string;
    stats: GamePlayerStats;
}

export interface GamePlayerStats {
    goals: number;
    assists: number;
    pims: number;
}

export interface GameTeamGoals extends BaseGameStat {
    scoredBy: string; // playerId
    assist1: string; // playerId
    assist2: string; // playerId
    type: GoalTypes;
}

export interface GameOpponentGoals extends BaseGameStat {
    name: string; // name of player
    type: GoalTypes;
}

export interface GameTeamPenalty extends BaseGameStat {
    playerId: string;
    type: PenaltyType;
    duration: number; // in minutes
}

export interface GameOpponentPenalty extends BaseGameStat {
    name: string; // name of player
    type: PenaltyType;
    duration: number; // in minutes
}

export interface BaseGameStat {
    minute: number;
    second: number;
}

export interface GameScore {
    team: number;
    opponent: number;
    periods: GamePeriodScore[];
}

export interface GamePeriodScore {
    number: number;
    team: number;
    opponent: number;
}

type GoalTypes = 'EVEN' | 'SH' | 'PP';

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
