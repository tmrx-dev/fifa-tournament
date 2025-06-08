
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  team?: Team;
}

export interface Team {
  id: string;
  name: string;
  logoUrl: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  description?: string; // Added missing property
  iconUrl?: string; // Added missing property (alias for logoUrl)
  memberCount?: number; // Added missing property
  // Statistics from backend
  totalMatches: number;
  wins: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  winRate: number;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  maxTeams: number;
  entryFee: number;
  prizePool: number;
  startDate: string;
  endDate?: string;
  status: TournamentStatus;
  ownerId: string;
  ownerName: string;
  teamCount: number;
  createdAt: string;
  teams?: Team[]; // Added missing property for tournament teams
}

export interface Match {
  id: string;
  tournamentId: string;
  tournamentName?: string;
  homeTeamId?: string;
  homeTeamName?: string;
  awayTeamId?: string;
  awayTeamName?: string;
  homeScore?: number;
  awayScore?: number;
  round: number;
  position: number;
  winnerId?: string;
  winnerName?: string;
  isCompleted: boolean;
  scheduledDate?: string;
  playedDate?: string;
}

export const TournamentStatus = {
  Draft: 0,
  Open: 1,
  InProgress: 2,
  Completed: 3,
  Cancelled: 4
} as const;

export type TournamentStatus = typeof TournamentStatus[keyof typeof TournamentStatus];

// DTOs for creating/updating entities
export interface CreateTeamDto {
  name: string;
  logoUrl?: string;
}

export interface UpdateTeamDto {
  name?: string;
  logoUrl?: string;
}

export interface CreateTournamentDto {
  name: string;
  description?: string;
  maxTeams: number;
  entryFee: number;
  prizePool: number;
  startDate: string;
}

export interface UpdateTournamentDto {
  name?: string;
  description?: string;
  maxTeams?: number;
  entryFee?: number;
  prizePool?: number;
  startDate?: string;
}

export interface RecordMatchResultDto {
  homeScore: number;
  awayScore: number;
}

export interface CreateUserDto {
  email: string;
  displayName: string;
  avatarUrl?: string;
  externalProvider: string;
  externalId: string;
}

export interface UpdateUserDto {
  displayName?: string;
  avatarUrl?: string;
}
