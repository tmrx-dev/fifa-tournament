
// Mock data for development when backend is not available
export const mockTeams = [
  {
    id: '1',
    name: 'Thunder Bolts',
    description: 'Fast-paced attacking team with great chemistry',
    logoUrl: '',
    ownerId: '123e4567-e89b-12d3-a456-426614174000',
    ownerName: 'Demo User',
    memberCount: 3,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Fire Eagles',
    description: 'Defensive masters with incredible teamwork',
    logoUrl: '',
    ownerId: '456e4567-e89b-12d3-a456-426614174001',
    ownerName: 'Jane Smith',
    memberCount: 5,
    createdAt: '2024-01-20T14:30:00Z',
  },
];

export const mockTournaments = [
  {
    id: '1',
    name: 'Summer Championship',
    description: 'The biggest tournament of the year',
    maxTeams: 16,
    entryFee: 50,
    prizePool: 800,
    startDate: '2024-02-01T09:00:00Z',
    endDate: null,
    status: 2, // InProgress
    ownerId: '123e4567-e89b-12d3-a456-426614174000',
    ownerName: 'Demo User',
    teamCount: 12,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: '2',
    name: 'Quick Cup',
    description: 'Fast and fun tournament',
    maxTeams: 8,
    entryFee: 20,
    prizePool: 160,
    startDate: '2024-02-15T16:00:00Z',
    endDate: null,
    status: 1, // Open
    ownerId: '456e4567-e89b-12d3-a456-426614174001',
    ownerName: 'Jane Smith',
    teamCount: 6,
    createdAt: '2024-01-25T12:00:00Z',
  },
];

// Mock API functions
export const mockTeamApi = {
  getAll: () => Promise.resolve({ data: mockTeams }),
  getById: (id: string) => Promise.resolve({ data: mockTeams.find(t => t.id === id) }),
  getByUserId: (userId: string) => Promise.resolve({ data: mockTeams.filter(t => t.ownerId === userId) }),
  create: (data: Record<string, unknown>) => Promise.resolve({ data: { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() } }),
  update: (id: string, data: Record<string, unknown>) => Promise.resolve({ data: { ...mockTeams.find(t => t.id === id), ...data } }),
  delete: (_id: string) => Promise.resolve({}),
  addMember: (_teamId: string, _userId: string) => Promise.resolve({}),
  removeMember: (_teamId: string, _userId: string) => Promise.resolve({}),
};

export const mockTournamentApi = {
  getAll: () => Promise.resolve({ data: mockTournaments }),
  getById: (id: string) => Promise.resolve({ data: mockTournaments.find(t => t.id === id) }),
  getByUserId: (userId: string) => Promise.resolve({ data: mockTournaments.filter(t => t.ownerId === userId) }),
  create: (data: Record<string, unknown>) => Promise.resolve({ data: { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() } }),
  update: (id: string, data: Record<string, unknown>) => Promise.resolve({ data: { ...mockTournaments.find(t => t.id === id), ...data } }),
  delete: (_id: string) => Promise.resolve({}),
  joinTeam: (_tournamentId: string, _teamId: string) => Promise.resolve({}),
  leaveTeam: (_tournamentId: string, _teamId: string) => Promise.resolve({}),
  start: (_id: string) => Promise.resolve({}),
  getBracket: (_id: string) => Promise.resolve({ data: [] }),
};

export const mockMatchApi = {
  getAll: () => Promise.resolve({ data: [] }),
  getById: (_id: string) => Promise.resolve({ data: null }),
  getByTournamentId: (_tournamentId: string) => Promise.resolve({ data: [] }),
  recordResult: (_id: string, _data: Record<string, unknown>) => Promise.resolve({ data: null }),
};
