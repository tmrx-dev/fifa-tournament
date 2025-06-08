import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Button,
  Grid,
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Modal,
  NumberInput,
  Table,
  Tabs,
  Loader,
  Center,
  Alert,
  Paper,
  Progress,
  Avatar,
  ActionIcon,
  Menu,
  Divider,
  SimpleGrid,
  Timeline,
  ThemeIcon,
  Accordion,
} from '@mantine/core';
import {
  IconTrophy,
  IconUsers,
  IconCalendar,
  IconTarget,
  IconEdit,
  IconTrash,
  IconPlayerPlay,
  IconSettings,
  IconChevronLeft,
  IconSword,
  IconCrown,
  IconMedal,
  IconDots,
  IconInfoCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi, matchApi, teamApi } from '../services/api';
import type { Match, Team } from '../types';
import { TournamentStatus } from '../types';
import { useAuth } from '../context/AuthContext';

export function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [recordScoreModalOpened, { open: openRecordScore, close: closeRecordScore }] = useDisclosure(false);
  const [startTournamentModalOpened, { open: openStartTournament, close: closeStartTournament }] = useDisclosure(false);
  const [joinTournamentModalOpened, { open: openJoinTournament, close: closeJoinTournament }] = useDisclosure(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Queries
  const { data: tournament, isLoading: tournamentLoading, error: tournamentError } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => id ? tournamentApi.getById(id).then(res => res.data) : null,
    enabled: !!id,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['tournament', id, 'matches'],
    queryFn: () => id ? matchApi.getByTournamentId(id).then(res => res.data) : [],
    enabled: !!id,
  });

  const { data: userTeam } = useQuery({
    queryKey: ['teams', 'my-team'],
    queryFn: () => teamApi.getMyTeam().then((res: { data: Team }) => res.data),
    enabled: !!user,
    retry: false,
  });

  // Mutations
  const startMutation = useMutation({
    mutationFn: (tournamentId: string) => tournamentApi.start(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      queryClient.invalidateQueries({ queryKey: ['tournament', id, 'matches'] });
      notifications.show({
        title: 'Success',
        message: 'Tournament started successfully! Matches have been generated.',
        color: 'green',
      });
      closeStartTournament();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to start tournament';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tournamentId: string) => tournamentApi.delete(tournamentId),
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Tournament deleted successfully',
        color: 'green',
      });
      navigate('/tournaments');
    },
  });

  const joinMutation = useMutation({
    mutationFn: (tournamentId: string) => tournamentApi.joinTeam(tournamentId, userTeam?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id] });
      notifications.show({
        title: 'Success',
        message: 'Successfully joined the tournament!',
        color: 'green',
      });
      closeJoinTournament();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to join tournament';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const recordScoreMutation = useMutation({
    mutationFn: ({ matchId, homeScore, awayScore }: { matchId: string; homeScore: number; awayScore: number }) =>
      matchApi.recordResult(matchId, { homeScore, awayScore }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament', id, 'matches'] });
      notifications.show({
        title: 'Success',
        message: 'Match result recorded successfully',
        color: 'green',
      });
      closeRecordScore();
      setSelectedMatch(null);
    },
  });

  // Form for recording match scores
  const scoreForm = useForm({
    initialValues: {
      homeScore: 0,
      awayScore: 0,
    },
    validate: {
      homeScore: (value) => value < 0 ? 'Score cannot be negative' : null,
      awayScore: (value) => value < 0 ? 'Score cannot be negative' : null,
    },
  });

  const handleRecordScore = (match: Match) => {
    setSelectedMatch(match);
    scoreForm.setValues({
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
    });
    openRecordScore();
  };

  const handleSubmitScore = (values: typeof scoreForm.values) => {
    if (selectedMatch) {
      recordScoreMutation.mutate({
        matchId: selectedMatch.id,
        homeScore: values.homeScore,
        awayScore: values.awayScore,
      });
    }
  };

  const getStatusBadge = (status: TournamentStatus) => {
    const colors = {
      [TournamentStatus.Draft]: 'gray',
      [TournamentStatus.Open]: 'blue',
      [TournamentStatus.InProgress]: 'orange',
      [TournamentStatus.Completed]: 'green',
      [TournamentStatus.Cancelled]: 'red',
    };

    const labels = {
      [TournamentStatus.Draft]: 'Draft',
      [TournamentStatus.Open]: 'Open',
      [TournamentStatus.InProgress]: 'In Progress',
      [TournamentStatus.Completed]: 'Completed',
      [TournamentStatus.Cancelled]: 'Cancelled',
    };

    return (
      <Badge color={colors[status]} variant="light" size="lg">
        {labels[status]}
      </Badge>
    );
  };

  const isOwner = tournament && user && tournament.ownerId === user.id;
  const isUserTeamInTournament = tournament?.teams?.some(team => team.ownerId === user?.id) || false;
  const canJoinTournament = tournament && user && userTeam && 
    tournament.status === TournamentStatus.Open && 
    !isUserTeamInTournament && 
    !isOwner &&
    (tournament.teamCount || 0) < tournament.maxTeams;

  if (tournamentLoading) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (tournamentError || !tournament) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconInfoCircle size={16} />} title="Tournament Not Found" color="red">
          The tournament you're looking for doesn't exist or has been removed.
        </Alert>
      </Container>
    );
  }

  // Calculate tournament stats
  const completedMatches = matches.filter(m => m.isCompleted).length;
  const totalMatches = matches.length;
  const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  return (
    <Container size="xl" py="md">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Group>
          <ActionIcon variant="subtle" onClick={() => navigate('/tournaments')}>
            <IconChevronLeft size={20} />
          </ActionIcon>
          <div>
            <Title order={1}>{tournament.name}</Title>
            <Text size="sm" c="dimmed">
              Tournament Management Center
            </Text>
          </div>
        </Group>
        
        {isOwner && (
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="light" size="lg">
                <IconDots size={20} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={14} />}>
                Edit Tournament
              </Menu.Item>
              {tournament.status === TournamentStatus.Open && (tournament.teamCount || 0) >= 2 && (
                <Menu.Item
                  leftSection={<IconPlayerPlay size={14} />}
                  onClick={openStartTournament}
                >
                  Start Tournament
                </Menu.Item>
              )}
              {tournament.status === TournamentStatus.Draft && (
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={() => deleteMutation.mutate(tournament.id)}
                >
                  Delete Tournament
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      {/* Tournament Overview */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Group>
                <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                  <IconTrophy size={24} />
                </ThemeIcon>
                <div>
                  <Text size="xl" fw={600}>{tournament.name}</Text>
                  <Text size="sm" c="dimmed">
                    Created by {tournament.ownerName} • {new Date(tournament.createdAt).toLocaleDateString()}
                  </Text>
                </div>
              </Group>
              {getStatusBadge(tournament.status)}
            </Group>

            {tournament.description && (
              <Text size="sm" c="dimmed" mb="md">
                {tournament.description}
              </Text>
            )}

            <Divider mb="md" />

            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
              <div>
                <Text size="sm" c="dimmed">Teams</Text>
                <Text size="lg" fw={600}>{tournament.teamCount || 0}/{tournament.maxTeams}</Text>
              </div>
              <div>
                <Text size="sm" c="dimmed">Start Date</Text>
                <Text size="lg" fw={600}>
                  {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'Not set'}
                </Text>
              </div>
              {tournament.entryFee > 0 && (
                <div>
                  <Text size="sm" c="dimmed">Entry Fee</Text>
                  <Text size="lg" fw={600} c="orange">${tournament.entryFee}</Text>
                </div>
              )}
              {tournament.prizePool > 0 && (
                <div>
                  <Text size="sm" c="dimmed">Prize Pool</Text>
                  <Text size="lg" fw={600} c="green">${tournament.prizePool}</Text>
                </div>
              )}
            </SimpleGrid>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Progress Card */}
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Group gap="md" mb="xs">
                <IconTarget size={24} color="blue" />
                <div>
                  <Text size="sm" c="dimmed">Tournament Progress</Text>
                  <Text size="lg" fw={600}>{progress.toFixed(0)}%</Text>
                </div>
              </Group>
              <Progress value={progress} color="blue" size="sm" />
              <Text size="xs" c="dimmed" mt="xs">
                {completedMatches} of {totalMatches} matches completed
              </Text>
            </Card>

            {/* Quick Actions */}
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Text size="sm" fw={600} mb="sm">Quick Actions</Text>
              <Stack gap="xs">
                {/* Tournament Owner Actions */}
                {isOwner && tournament.status === TournamentStatus.Open && (tournament.teamCount || 0) >= 2 && (
                  <Button
                    leftSection={<IconPlayerPlay size={16} />}
                    size="sm"
                    color="green"
                    loading={startMutation.isPending}
                    onClick={openStartTournament}
                  >
                    Start Tournament
                  </Button>
                )}
                {isOwner && tournament.status === TournamentStatus.Open && (tournament.teamCount || 0) < 2 && (
                  <Alert icon={<IconInfoCircle size={16} />} color="yellow">
                    <Text size="xs">Need at least 2 teams to start</Text>
                  </Alert>
                )}

                {/* Join Tournament Actions */}
                {canJoinTournament && (
                  <Button
                    leftSection={<IconUsers size={16} />}
                    size="sm"
                    color="blue"
                    loading={joinMutation.isPending}
                    onClick={openJoinTournament}
                  >
                    Join Tournament
                  </Button>
                )}
                {user && !userTeam && tournament.status === TournamentStatus.Open && !isOwner && (
                  <Alert icon={<IconInfoCircle size={16} />} color="orange">
                    <Text size="xs">Create a team first to join tournaments</Text>
                  </Alert>
                )}
                {isUserTeamInTournament && (
                  <Alert icon={<IconCheck size={16} />} color="green">
                    <Text size="xs">Your team is already registered!</Text>
                  </Alert>
                )}
                {tournament.status === TournamentStatus.Open && (tournament.teamCount || 0) >= tournament.maxTeams && !isUserTeamInTournament && !isOwner && (
                  <Alert icon={<IconInfoCircle size={16} />} color="red">
                    <Text size="xs">Tournament is full</Text>
                  </Alert>
                )}

                {/* Common Actions */}
                <Button
                  leftSection={<IconUsers size={16} />}
                  variant="light"
                  size="sm"
                  onClick={() => {
                    const participantsTab = document.querySelector('[data-value="participants"]') as HTMLElement;
                    participantsTab?.click();
                  }}
                >
                  View Participants
                </Button>
                {isOwner && (
                  <Button
                    leftSection={<IconSettings size={16} />}
                    variant="subtle"
                    size="sm"
                  >
                    Tournament Settings
                  </Button>
                )}
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Main Content Tabs */}
      <Tabs defaultValue="bracket" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="bracket" leftSection={<IconSword size={16} />}>
            Bracket
          </Tabs.Tab>
          <Tabs.Tab value="participants" leftSection={<IconUsers size={16} />}>
            Participants ({tournament.teamCount || 0})
          </Tabs.Tab>
          <Tabs.Tab value="stats" leftSection={<IconTarget size={16} />}>
            Statistics
          </Tabs.Tab>
          <Tabs.Tab value="timeline" leftSection={<IconCalendar size={16} />}>
            Timeline
          </Tabs.Tab>
        </Tabs.List>

        {/* Bracket Tab */}
        <Tabs.Panel value="bracket" pt="md">
          {matchesLoading ? (
            <Center p="xl">
              <Loader size="lg" />
            </Center>
          ) : rounds.length > 0 ? (
            <Stack gap="xl">
              {rounds.map(round => (
                <div key={round}>
                  <Title order={3} mb="md">Round {round}</Title>
                  <Grid>
                    {matchesByRound[round].map(match => (
                      <Grid.Col key={match.id} span={{ base: 12, sm: 6, lg: 4 }}>
                        <Card shadow="sm" padding="md" radius="md" withBorder>
                          <Group justify="space-between" mb="sm">
                            <Text size="sm" fw={600}>Match {match.position}</Text>
                            {match.isCompleted && (
                              <Badge color="green" variant="light" size="sm">
                                <IconCheck size={12} />
                              </Badge>
                            )}
                          </Group>
                          
                          <Stack gap="xs">
                            <Group justify="space-between">
                              <Group gap="xs">
                                <Avatar size="sm" color="blue">
                                  {match.homeTeamName?.charAt(0) || 'T'}
                                </Avatar>
                                <Text size="sm">{match.homeTeamName || 'TBD'}</Text>
                              </Group>
                              <Text size="sm" fw={600}>
                                {match.isCompleted ? match.homeScore : '-'}
                              </Text>
                            </Group>
                            
                            <Group justify="space-between">
                              <Group gap="xs">
                                <Avatar size="sm" color="red">
                                  {match.awayTeamName?.charAt(0) || 'T'}
                                </Avatar>
                                <Text size="sm">{match.awayTeamName || 'TBD'}</Text>
                              </Group>
                              <Text size="sm" fw={600}>
                                {match.isCompleted ? match.awayScore : '-'}
                              </Text>
                            </Group>
                          </Stack>

                          {!match.isCompleted && match.homeTeamName && match.awayTeamName && (
                            <Button
                              size="xs"
                              variant="light"
                              fullWidth
                              mt="sm"
                              onClick={() => handleRecordScore(match)}
                            >
                              Record Score
                            </Button>
                          )}
                          
                          {match.winnerName && (
                            <Group justify="center" mt="sm">
                              <IconCrown size={16} color="gold" />
                              <Text size="xs" fw={600} c="yellow">
                                Winner: {match.winnerName}
                              </Text>
                            </Group>
                          )}
                        </Card>
                      </Grid.Col>
                    ))}
                  </Grid>
                </div>
              ))}
            </Stack>
          ) : (
            <Paper p="xl" radius="md" withBorder>
              <Center>
                <Stack align="center" gap="md">
                  <IconSword size={48} color="gray" />
                  <Text size="lg" c="dimmed">No matches generated yet</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    {tournament.status === TournamentStatus.Open 
                      ? 'Start the tournament to generate the bracket'
                      : 'Waiting for tournament to begin'
                    }
                  </Text>
                  {isOwner && tournament.status === TournamentStatus.Open && (tournament.teamCount || 0) >= 2 && (
                    <Button 
                      leftSection={<IconPlayerPlay size={16} />}
                      color="green"
                      onClick={openStartTournament}
                      loading={startMutation.isPending}
                    >
                      Start Tournament & Generate Bracket
                    </Button>
                  )}
                  {isOwner && tournament.status === TournamentStatus.Open && (tournament.teamCount || 0) < 2 && (
                    <Alert icon={<IconInfoCircle size={16} />} color="yellow">
                      <Text size="sm">At least 2 teams are required to start the tournament</Text>
                    </Alert>
                  )}
                </Stack>
              </Center>
            </Paper>
          )}
        </Tabs.Panel>

        {/* Participants Tab */}
        <Tabs.Panel value="participants" pt="md">
          <Stack gap="lg">
            {/* Tournament Status Banner */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" align="center">
                <div>
                  <Group gap="md" align="center">
                    <ThemeIcon size="xl" variant="light" color={tournament.status === TournamentStatus.Open ? "blue" : "orange"}>
                      <IconUsers size={24} />
                    </ThemeIcon>
                    <div>
                      <Text size="lg" fw={600}>
                        {tournament.teamCount || 0} Teams Registered
                      </Text>
                      <Text size="sm" c="dimmed">
                        {tournament.status === TournamentStatus.Open 
                          ? `${tournament.maxTeams - (tournament.teamCount || 0)} spots remaining` 
                          : tournament.status === TournamentStatus.InProgress 
                            ? 'Tournament in progress' 
                            : 'Registration closed'
                        }
                      </Text>
                    </div>
                  </Group>
                </div>
                
                <Group gap="md">
                  <Progress 
                    value={((tournament.teamCount || 0) / tournament.maxTeams) * 100} 
                    size="xl" 
                    radius="md"
                    style={{ width: 200 }}
                    color={tournament.teamCount === tournament.maxTeams ? "green" : "blue"}
                  />
                  <Text size="sm" c="dimmed">
                    {tournament.teamCount || 0}/{tournament.maxTeams}
                  </Text>
                </Group>
              </Group>
            </Card>

            {/* Teams Grid */}
            {tournament.teams && tournament.teams.length > 0 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {tournament.teams.map((team, index) => (
                  <Card key={team.id} shadow="sm" padding="lg" radius="md" withBorder>
                    <Stack gap="md">
                      {/* Team Header */}
                      <Group justify="space-between" align="flex-start">
                        <Group gap="md">
                          <Avatar 
                            src={team.logoUrl} 
                            size="lg" 
                            radius="md"
                            color="blue"
                          >
                            <IconUsers size={24} />
                          </Avatar>
                          <div>
                            <Text size="lg" fw={600}>{team.name}</Text>
                            <Text size="sm" c="dimmed">
                              Owner: {team.ownerName}
                            </Text>
                          </div>
                        </Group>
                        <Badge 
                          variant="light" 
                          color="blue"
                          size="sm"
                        >
                          #{index + 1}
                        </Badge>
                      </Group>

                      <Divider />

                      {/* Team Stats */}
                      <SimpleGrid cols={2} spacing="xs">
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Matches</Text>
                          <Text size="lg" fw={600}>{team.totalMatches}</Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Win Rate</Text>
                          <Text size="lg" fw={600} c={team.winRate > 0.5 ? "green" : team.winRate > 0 ? "orange" : "gray"}>
                            {team.totalMatches > 0 ? `${(team.winRate * 100).toFixed(0)}%` : '-'}
                          </Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Goals For</Text>
                          <Text size="lg" fw={600} c="blue">{team.goalsFor}</Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Goals Against</Text>
                          <Text size="lg" fw={600} c="red">{team.goalsAgainst}</Text>
                        </div>
                      </SimpleGrid>

                      {/* Team Performance Indicator */}
                      <Group justify="center" mt="xs">
                        {team.totalMatches > 0 ? (
                          <Group gap="xs">
                            <Text size="xs" c="dimmed">Performance:</Text>
                            <Badge 
                              size="sm"
                              color={
                                team.winRate >= 0.7 ? "green" :
                                team.winRate >= 0.5 ? "blue" :
                                team.winRate >= 0.3 ? "orange" : "red"
                              }
                              variant="light"
                            >
                              {team.winRate >= 0.7 ? "Excellent" :
                               team.winRate >= 0.5 ? "Good" :
                               team.winRate >= 0.3 ? "Fair" : "Needs Improvement"}
                            </Badge>
                          </Group>
                        ) : (
                          <Badge size="sm" color="gray" variant="light">
                            No matches played
                          </Badge>
                        )}
                      </Group>

                      {/* Join Date */}
                      <Group justify="space-between" align="center" mt="xs">
                        <Text size="xs" c="dimmed">
                          Joined: {new Date(team.createdAt).toLocaleDateString()}
                        </Text>
                        <ActionIcon variant="subtle" size="sm">
                          <IconInfoCircle size={16} />
                        </ActionIcon>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            ) : (
              <Paper p="xl" radius="md" withBorder>
                <Center>
                  <Stack align="center" gap="md">
                    <IconUsers size={48} color="gray" />
                    <Text size="lg" c="dimmed">No teams registered yet</Text>
                    <Text size="sm" c="dimmed" ta="center">
                      {tournament.status === TournamentStatus.Open 
                        ? 'Teams can still join this tournament'
                        : 'Registration is closed for this tournament'
                      }
                    </Text>
                    {tournament.status === TournamentStatus.Open && (
                      <Button leftSection={<IconUsers size={16} />} variant="light">
                        Invite Teams
                      </Button>
                    )}
                  </Stack>
                </Center>
              </Paper>
            )}

            {/* Tournament Info Summary */}
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Text size="sm" fw={600} mb="xs">Tournament Information</Text>
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Entry Fee</Text>
                  <Text size="sm" fw={600}>
                    {tournament.entryFee > 0 ? `$${tournament.entryFee}` : 'Free'}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Prize Pool</Text>
                  <Text size="sm" fw={600} c="green">
                    {tournament.prizePool > 0 ? `$${tournament.prizePool}` : 'No prizes'}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Start Date</Text>
                  <Text size="sm" fw={600}>
                    {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD'}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Status</Text>
                  {getStatusBadge(tournament.status)}
                </div>
              </SimpleGrid>
            </Card>

            {/* Leaderboard Preview */}
            {tournament.teams && tournament.teams.length > 0 && (
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Text size="lg" fw={600}>Current Standings</Text>
                  <Badge variant="light" color="blue">
                    {tournament.status === TournamentStatus.InProgress ? 'Live' : 'Pre-Tournament'}
                  </Badge>
                </Group>
                
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Rank</Table.Th>
                      <Table.Th>Team</Table.Th>
                      <Table.Th>Matches</Table.Th>
                      <Table.Th>W-L</Table.Th>
                      <Table.Th>Goals</Table.Th>
                      <Table.Th>Win Rate</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {tournament.teams
                      .sort((a, b) => {
                        // Sort by win rate, then by goal difference, then by goals for
                        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
                        if ((b.goalsFor - b.goalsAgainst) !== (a.goalsFor - a.goalsAgainst)) {
                          return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
                        }
                        return b.goalsFor - a.goalsFor;
                      })
                      .map((team, index) => (
                        <Table.Tr key={team.id}>
                          <Table.Td>
                            <Group gap="xs">
                              <Text fw={600}>#{index + 1}</Text>
                              {index === 0 && team.totalMatches > 0 && (
                                <IconCrown size={16} color="gold" />
                              )}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="sm">
                              <Avatar src={team.logoUrl} size="sm" radius="sm">
                                {team.name.charAt(0)}
                              </Avatar>
                              <div>
                                <Text size="sm" fw={500}>{team.name}</Text>
                                <Text size="xs" c="dimmed">{team.ownerName}</Text>
                              </div>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{team.totalMatches}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              <Text component="span" c="green">{team.wins}</Text>
                              -
                              <Text component="span" c="red">{team.losses}</Text>
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              {team.goalsFor}-{team.goalsAgainst}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text 
                              size="sm" 
                              fw={600}
                              c={team.winRate >= 0.6 ? "green" : team.winRate >= 0.4 ? "blue" : "red"}
                            >
                              {team.totalMatches > 0 ? `${(team.winRate * 100).toFixed(1)}%` : '-'}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </Table>
              </Card>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Statistics Tab */}
        <Tabs.Panel value="stats" pt="md">
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Group gap="md">
                <IconTarget size={32} color="blue" />
                <div>
                  <Text size="xl" fw={700}>{totalMatches}</Text>
                  <Text size="sm" c="dimmed">Total Matches</Text>
                </div>
              </Group>
            </Card>
            
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Group gap="md">
                <IconCheck size={32} color="green" />
                <div>
                  <Text size="xl" fw={700}>{completedMatches}</Text>
                  <Text size="sm" c="dimmed">Completed</Text>
                </div>
              </Group>
            </Card>
            
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Group gap="md">
                <IconX size={32} color="orange" />
                <div>
                  <Text size="xl" fw={700}>{totalMatches - completedMatches}</Text>
                  <Text size="sm" c="dimmed">Remaining</Text>
                </div>
              </Group>
            </Card>
          </SimpleGrid>
        </Tabs.Panel>

        {/* Timeline Tab */}
        <Tabs.Panel value="timeline" pt="md">
          <Timeline active={1} bulletSize={24} lineWidth={2}>
            <Timeline.Item bullet={<IconTrophy size={12} />} title="Tournament Created">
              <Text c="dimmed" size="sm">
                {new Date(tournament.createdAt).toLocaleDateString()} at{' '}
                {new Date(tournament.createdAt).toLocaleTimeString()}
              </Text>
            </Timeline.Item>
            
            {tournament.status !== TournamentStatus.Draft && (
              <Timeline.Item bullet={<IconPlayerPlay size={12} />} title="Tournament Started">
                <Text c="dimmed" size="sm">Tournament bracket generated and matches scheduled</Text>
              </Timeline.Item>
            )}
            
            {tournament.status === TournamentStatus.Completed && (
              <Timeline.Item bullet={<IconMedal size={12} />} title="Tournament Completed">
                <Text c="dimmed" size="sm">Winner determined and prizes awarded</Text>
              </Timeline.Item>
            )}
          </Timeline>
        </Tabs.Panel>
      </Tabs>

      {/* Record Score Modal */}
      <Modal
        opened={recordScoreModalOpened}
        onClose={() => {
          closeRecordScore();
          setSelectedMatch(null);
        }}
        title="Record Match Result"
        centered
      >
        {selectedMatch && (
          <form onSubmit={scoreForm.onSubmit(handleSubmitScore)}>
            <Stack gap="md">
              <Text size="sm" c="dimmed" ta="center">
                Round {selectedMatch.round} - Match {selectedMatch.position}
              </Text>
              
              <Group grow>
                <Stack gap="xs" align="center">
                  <Avatar size="lg" color="blue">
                    {selectedMatch.homeTeamName?.charAt(0)}
                  </Avatar>
                  <Text size="sm" fw={600} ta="center">
                    {selectedMatch.homeTeamName}
                  </Text>
                  <NumberInput
                    placeholder="0"
                    min={0}
                    {...scoreForm.getInputProps('homeScore')}
                  />
                </Stack>
                
                <Text size="xl" fw={600} ta="center" mt="xl">
                  VS
                </Text>
                
                <Stack gap="xs" align="center">
                  <Avatar size="lg" color="red">
                    {selectedMatch.awayTeamName?.charAt(0)}
                  </Avatar>
                  <Text size="sm" fw={600} ta="center">
                    {selectedMatch.awayTeamName}
                  </Text>
                  <NumberInput
                    placeholder="0"
                    min={0}
                    {...scoreForm.getInputProps('awayScore')}
                  />
                </Stack>
              </Group>

              <Group justify="flex-end" gap="md" mt="md">
                <Button variant="light" onClick={() => {
                  closeRecordScore();
                  setSelectedMatch(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" loading={recordScoreMutation.isPending}>
                  Record Result
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

      {/* Start Tournament Confirmation Modal */}
      <Modal
        opened={startTournamentModalOpened}
        onClose={closeStartTournament}
        title="Start Tournament"
        centered
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />} color="blue">
            <Text size="sm">
              Are you sure you want to start the tournament? This action cannot be undone.
            </Text>
          </Alert>

          <Card padding="md" withBorder>
            <Text size="sm" fw={600} mb="sm">Tournament Summary</Text>
            <SimpleGrid cols={2} spacing="xs">
              <div>
                <Text size="xs" c="dimmed">Teams Registered</Text>
                <Text size="sm" fw={600}>{tournament?.teamCount || 0}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Tournament Format</Text>
                <Text size="sm" fw={600}>Single Elimination</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Total Matches</Text>
                <Text size="sm" fw={600}>
                  {tournament?.teamCount ? (tournament.teamCount - 1) : 0}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Rounds</Text>
                <Text size="sm" fw={600}>
                  {tournament?.teamCount ? Math.ceil(Math.log2(tournament.teamCount)) : 0}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">First Round Matches</Text>
                <Text size="sm" fw={600}>
                  {tournament?.teamCount ? Math.floor(tournament.teamCount / 2) : 0}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Prize Pool</Text>
                <Text size="sm" fw={600} c="green">
                  {tournament?.prizePool ? `$${tournament.prizePool}` : 'No prizes'}
                </Text>
              </div>
            </SimpleGrid>
          </Card>

          {tournament?.teams && tournament.teams.length > 0 && (
            <Card padding="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text size="sm" fw={600}>Team Draw Preview</Text>
                <Badge variant="light" color="orange" size="sm">
                  Random Draw
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" mb="sm">
                Teams will be randomly shuffled and placed in bracket positions
              </Text>
              
              <Accordion variant="separated">
                <Accordion.Item value="teams">
                  <Accordion.Control>
                    <Group gap="sm">
                      <IconUsers size={16} />
                      <Text size="sm">View All {tournament.teams.length} Teams</Text>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <SimpleGrid cols={2} spacing="xs">
                      {tournament.teams.map((team) => (
                        <Group key={team.id} gap="sm">
                          <Avatar src={team.logoUrl} size="xs" radius="sm">
                            {team.name.charAt(0)}
                          </Avatar>
                          <Text size="xs">{team.name}</Text>
                        </Group>
                      ))}
                    </SimpleGrid>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>

              {/* Bracket Structure Preview */}
              <Stack gap="xs" mt="md">
                <Text size="xs" fw={600} c="dimmed">Bracket Structure:</Text>
                <Group gap="lg">
                  <div>
                    <Text size="xs" c="dimmed">Round 1</Text>
                    <Text size="sm" fw={600}>
                      {Math.floor((tournament.teamCount || 0) / 2)} matches
                    </Text>
                  </div>
                  {tournament.teamCount > 2 && (
                    <div>
                      <Text size="xs" c="dimmed">Round 2</Text>
                      <Text size="sm" fw={600}>
                        {Math.floor(Math.floor((tournament.teamCount || 0) / 2) / 2)} matches
                      </Text>
                    </div>
                  )}
                  {tournament.teamCount > 4 && (
                    <div>
                      <Text size="xs" c="dimmed">Finals</Text>
                      <Text size="sm" fw={600}>1 match</Text>
                    </div>
                  )}
                </Group>
                {(tournament.teamCount || 0) % 2 === 1 && (
                  <Alert color="yellow" icon={<IconInfoCircle size={12} />}>
                    <Text size="xs">
                      One team will receive a bye (automatic advance) due to odd number of participants
                    </Text>
                  </Alert>
                )}
              </Stack>
            </Card>
          )}

          <Text size="sm" c="dimmed" ta="center">
            Starting the tournament will:
          </Text>
          <Stack gap="xs">
            <Group gap="xs">
              <IconCheck size={16} color="green" />
              <Text size="sm">Generate tournament bracket</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={16} color="green" />
              <Text size="sm">Create first round matches</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={16} color="green" />
              <Text size="sm">Close team registration</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={16} color="green" />
              <Text size="sm">Enable score recording</Text>
            </Group>
          </Stack>

          <Group justify="flex-end" gap="md" mt="lg">
            <Button variant="light" onClick={closeStartTournament}>
              Cancel
            </Button>
            <Button 
              color="green"
              loading={startMutation.isPending}
              onClick={() => {
                if (tournament) {
                  startMutation.mutate(tournament.id);
                }
              }}
            >
              Start Tournament
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Join Tournament Confirmation Modal */}
      <Modal
        opened={joinTournamentModalOpened}
        onClose={closeJoinTournament}
        title="Join Tournament"
        centered
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />} color="blue">
            <Text size="sm">
              Do you want to join this tournament with your team?
            </Text>
          </Alert>

          {/* Tournament Info */}
          <Card padding="md" withBorder>
            <Text size="sm" fw={600} mb="sm">Tournament Details</Text>
            <SimpleGrid cols={2} spacing="xs">
              <div>
                <Text size="xs" c="dimmed">Tournament</Text>
                <Text size="sm" fw={600}>{tournament?.name}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Current Teams</Text>
                <Text size="sm" fw={600}>{tournament?.teamCount || 0}/{tournament?.maxTeams}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Entry Fee</Text>
                <Text size="sm" fw={600} c={tournament?.entryFee ? "orange" : "green"}>
                  {tournament?.entryFee ? `$${tournament.entryFee}` : 'Free'}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">Prize Pool</Text>
                <Text size="sm" fw={600} c="green">
                  {tournament?.prizePool ? `$${tournament.prizePool}` : 'No prizes'}
                </Text>
              </div>
            </SimpleGrid>
          </Card>

          {/* User Team Info */}
          {userTeam && (
            <Card padding="md" withBorder>
              <Text size="sm" fw={600} mb="sm">Your Team</Text>
              <Group gap="md">
                <Avatar src={userTeam.logoUrl} size="lg" radius="md">
                  <IconUsers size={24} />
                </Avatar>
                <div>
                  <Text size="lg" fw={600}>{userTeam.name}</Text>
                  <Text size="sm" c="dimmed">Owner: {userTeam.ownerName}</Text>
                  <Group gap="md" mt="xs">
                    <Text size="xs" c="dimmed">
                      Matches: {userTeam.totalMatches}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Win Rate: {userTeam.totalMatches > 0 ? `${(userTeam.winRate * 100).toFixed(1)}%` : 'No matches'}
                    </Text>
                  </Group>
                </div>
              </Group>
            </Card>
          )}

          <Text size="sm" c="dimmed" ta="center">
            Joining this tournament will:
          </Text>
          <Stack gap="xs">
            <Group gap="xs">
              <IconCheck size={16} color="green" />
              <Text size="sm">Register your team for competition</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={16} color="green" />
              <Text size="sm">Add you to the participants list</Text>
            </Group>
            <Group gap="xs">
              <IconCheck size={16} color="green" />
              <Text size="sm">Enable you to compete in matches</Text>
            </Group>
            {tournament?.entryFee && tournament.entryFee > 0 && (
              <Group gap="xs">
                <IconInfoCircle size={16} color="orange" />
                <Text size="sm">Require payment of ${tournament.entryFee} entry fee</Text>
              </Group>
            )}
          </Stack>

          <Group justify="flex-end" gap="md" mt="lg">
            <Button variant="light" onClick={closeJoinTournament}>
              Cancel
            </Button>
            <Button 
              color="blue"
              loading={joinMutation.isPending}
              disabled={!userTeam}
              onClick={() => {
                if (tournament) {
                  joinMutation.mutate(tournament.id);
                }
              }}
            >
              Join Tournament
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}