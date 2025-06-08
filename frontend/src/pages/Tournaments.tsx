import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextInput,
  Textarea,
  NumberInput,
  ActionIcon,
  Menu,
  Table,
  Tabs,
  Loader,
  Center,
  Alert,
  Paper,
  Switch,
  Divider,
  Collapse,
} from '@mantine/core';
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconUsers,
  IconTrophy,
  IconCalendar,
  IconCurrencyDollar,
  IconTarget,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentApi, teamApi, matchApi } from '../services/api';
import type { Tournament, CreateTournamentDto } from '../types';
import { TournamentStatus } from '../types';
import { useAuth } from '../context/AuthContext';

export function Tournaments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [bracketModalOpened, { open: openBracket, close: closeBracket }] = useDisclosure(false);
  
  // Optional features state
  const [hasEntryFee, setHasEntryFee] = useState(false);
  const [hasPrizePool, setHasPrizePool] = useState(false);

  // Queries
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentApi.getAll().then(res => res.data),
  });

  const { data: userTeams = [] } = useQuery({
    queryKey: ['teams', 'user', user?.id],
    queryFn: () => user ? teamApi.getByUserId(user.id).then(res => res.data) : [],
    enabled: !!user,
  });

  const { data: bracket = [], isLoading: bracketLoading } = useQuery({
    queryKey: ['tournament', selectedTournament?.id, 'bracket'],
    queryFn: () => selectedTournament ? matchApi.getByTournamentId(selectedTournament.id).then(res => res.data) : [],
    enabled: !!selectedTournament,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateTournamentDto) => tournamentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      notifications.show({
        title: 'Success',
        message: 'Tournament created successfully',
        color: 'green',
      });
      close();
      form.reset();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create tournament';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tournamentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      notifications.show({
        title: 'Success',
        message: 'Tournament deleted successfully',
        color: 'green',
      });
    },
  });

  const joinMutation = useMutation({
    mutationFn: ({ tournamentId, teamId }: { tournamentId: string; teamId: string }) =>
      tournamentApi.joinTeam(tournamentId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      notifications.show({
        title: 'Success',
        message: 'Team joined tournament successfully',
        color: 'green',
      });
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => tournamentApi.start(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      notifications.show({
        title: 'Success',
        message: 'Tournament started successfully',
        color: 'green',
      });
    },
  });

  // Form
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      maxTeams: 8,
      entryFee: 0,
      prizePool: 0,
      startDate: '',
    },
    validate: {
      name: (value) => value.length < 2 ? 'Name must have at least 2 characters' : null,
      maxTeams: (value) => value < 2 ? 'Must have at least 2 teams' : null,
      startDate: (value) => !value ? 'Start date is required' : null,
    },
  });

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setHasEntryFee(tournament.entryFee > 0);
    setHasPrizePool(tournament.prizePool > 0);
    form.setValues({
      name: tournament.name,
      description: tournament.description || '',
      maxTeams: tournament.maxTeams,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      startDate: tournament.startDate.split('T')[0],
    });
    open();
  };

  const handleSubmit = (values: typeof form.values) => {
    const data: CreateTournamentDto = {
      ...values,
      entryFee: hasEntryFee ? values.entryFee : 0,
      prizePool: hasPrizePool ? values.prizePool : 0,
      startDate: new Date(values.startDate).toISOString(),
    };
    createMutation.mutate(data);
  };

  const handleModalClose = () => {
    close();
    form.reset();
    setEditingTournament(null);
    setHasEntryFee(false);
    setHasPrizePool(false);
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
      <Badge color={colors[status]} variant="light">
        {labels[status]}
      </Badge>
    );
  };

  const canJoinTournament = (tournament: Tournament) => {
    return tournament.status === TournamentStatus.Open && 
           tournament.teamCount < tournament.maxTeams &&
           userTeams.length > 0 &&
           tournament.ownerId !== user?.id;
  };

  const viewBracket = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    openBracket();
  };

  if (tournamentsLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Tournaments</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Create Tournament
        </Button>
      </Group>

      <Tabs defaultValue="all" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="all">All Tournaments</Tabs.Tab>
          <Tabs.Tab value="my">My Tournaments</Tabs.Tab>
          <Tabs.Tab value="joined">Joined Tournaments</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="all" pt="md">
          <Grid>
            {tournaments.map((tournament) => (
              <Grid.Col key={tournament.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <Card 
                  shadow="sm" 
                  padding="lg" 
                  radius="md" 
                  withBorder
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/tournaments/${tournament.id}`)}
                >
                  <Group justify="space-between" mb="xs">
                    <Text fw={500} size="lg">{tournament.name}</Text>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" onClick={(e) => e.stopPropagation()}>
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        {tournament.ownerId === user?.id && (
                          <>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleEdit(tournament)}
                            >
                              Edit
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => deleteMutation.mutate(tournament.id)}
                            >
                              Delete
                            </Menu.Item>
                            {tournament.status === TournamentStatus.Open && tournament.teamCount >= 2 && (
                              <Menu.Item
                                leftSection={<IconTarget size={14} />}
                                onClick={() => startMutation.mutate(tournament.id)}
                              >
                                Start Tournament
                              </Menu.Item>
                            )}
                          </>
                        )}
                        <Menu.Item
                          leftSection={<IconTarget size={14} />}
                          onClick={() => navigate(`/tournaments/${tournament.id}`)}
                        >
                          {tournament.ownerId === user?.id ? 'Manage Tournament' : 'View Details'}
                        </Menu.Item>
                        {canJoinTournament(tournament) && (
                          <Menu.Item
                            leftSection={<IconUsers size={14} />}
                            onClick={() => {
                              if (userTeams.length === 1) {
                                joinMutation.mutate({
                                  tournamentId: tournament.id,
                                  teamId: userTeams[0].id,
                                });
                              }
                            }}
                          >
                            Join Tournament
                          </Menu.Item>
                        )}
                        {(tournament.status === TournamentStatus.InProgress || 
                          tournament.status === TournamentStatus.Completed) && (
                          <Menu.Item
                            leftSection={<IconTarget size={14} />}
                            onClick={() => viewBracket(tournament)}
                          >
                            View Bracket
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Group>

                  <Stack gap="xs">
                    {tournament.description && (
                      <Text size="sm" c="dimmed">{tournament.description}</Text>
                    )}
                    
                    <Group justify="space-between">
                      <Text size="sm">Status:</Text>
                      {getStatusBadge(tournament.status)}
                    </Group>

                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconUsers size={16} />
                        <Text size="sm">{tournament.teamCount}/{tournament.maxTeams} teams</Text>
                      </Group>
                      {(tournament.entryFee > 0 || tournament.prizePool > 0) && (
                        <Group gap="xs">
                          <IconCurrencyDollar size={16} />
                          <Text size="sm">
                            {tournament.entryFee > 0 && `$${tournament.entryFee} entry`}
                            {tournament.entryFee > 0 && tournament.prizePool > 0 && ' • '}
                            {tournament.prizePool > 0 && `$${tournament.prizePool} prize`}
                          </Text>
                        </Group>
                      )}
                    </Group>

                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconCalendar size={16} />
                        <Text size="sm">{new Date(tournament.startDate).toLocaleDateString()}</Text>
                      </Group>
                      <Text size="xs" c="dimmed">by {tournament.ownerName}</Text>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>

          {tournaments.length === 0 && (
            <Paper p="xl" radius="md" withBorder>
              <Center>
                <Stack align="center" gap="md">
                  <IconTrophy size={48} color="gray" />
                  <Text size="lg" c="dimmed">No tournaments yet</Text>
                  <Text size="sm" c="dimmed">Create your first tournament to get started!</Text>
                </Stack>
              </Center>
            </Paper>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="my" pt="md">
          <Text c="dimmed">Feature coming soon - My Tournaments</Text>
        </Tabs.Panel>

        <Tabs.Panel value="joined" pt="md">
          <Text c="dimmed">Feature coming soon - Joined Tournaments</Text>
        </Tabs.Panel>
      </Tabs>

      {/* Create/Edit Tournament Modal */}
      <Modal
        opened={opened}
        onClose={handleModalClose}
        title={editingTournament ? 'Edit Tournament' : 'Create Tournament'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Tournament Name"
              placeholder="Enter tournament name"
              required
              {...form.getInputProps('name')}
            />

            <Textarea
              label="Description"
              placeholder="Enter tournament description"
              {...form.getInputProps('description')}
            />

            <Group grow>
              <NumberInput
                label="Max Teams"
                placeholder="8"
                min={2}
                max={64}
                required
                {...form.getInputProps('maxTeams')}
              />

              <TextInput
                label="Start Date"
                type="date"
                required
                {...form.getInputProps('startDate')}
              />
            </Group>

            <Divider label="Optional Features" labelPosition="center" my="md" />

            <Stack gap="sm">
              <Switch
                label="Entry Fee"
                description="Charge an entry fee for teams to join"
                checked={hasEntryFee}
                onChange={(event) => {
                  setHasEntryFee(event.currentTarget.checked);
                  if (!event.currentTarget.checked) {
                    form.setFieldValue('entryFee', 0);
                  }
                }}
              />
              
              <Collapse in={hasEntryFee}>
                <NumberInput
                  label="Entry Fee ($)"
                  placeholder="10.00"
                  min={0}
                  step={0.01}
                  decimalScale={2}
                  description="Amount each team must pay to participate"
                  {...form.getInputProps('entryFee')}
                />
              </Collapse>

              <Switch
                label="Prize Pool"
                description="Set a prize pool for the tournament winner"
                checked={hasPrizePool}
                onChange={(event) => {
                  setHasPrizePool(event.currentTarget.checked);
                  if (!event.currentTarget.checked) {
                    form.setFieldValue('prizePool', 0);
                  }
                }}
              />
              
              <Collapse in={hasPrizePool}>
                <NumberInput
                  label="Prize Pool ($)"
                  placeholder="100.00"
                  min={0}
                  step={0.01}
                  decimalScale={2}
                  description="Total prize money for the winner"
                  {...form.getInputProps('prizePool')}
                />
              </Collapse>
            </Stack>

            <Group justify="flex-end" gap="md" mt="lg">
              <Button variant="light" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                {editingTournament ? 'Update' : 'Create'} Tournament
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Bracket Modal */}
      <Modal
        opened={bracketModalOpened}
        onClose={closeBracket}
        title={`${selectedTournament?.name} - Tournament Bracket`}
        size="xl"
        centered
      >
        {bracketLoading ? (
          <Center p="xl">
            <Loader size="lg" />
          </Center>
        ) : bracket.length > 0 ? (
          <Stack gap="md">
            <Alert icon={<IconInfoCircle size={16} />} title="Tournament Bracket" color="blue">
              Track the progress of all matches in this tournament
            </Alert>
            
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Round</Table.Th>
                  <Table.Th>Match</Table.Th>
                  <Table.Th>Home Team</Table.Th>
                  <Table.Th>Away Team</Table.Th>
                  <Table.Th>Score</Table.Th>
                  <Table.Th>Winner</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {bracket.map((match) => (
                  <Table.Tr key={match.id}>
                    <Table.Td>Round {match.round}</Table.Td>
                    <Table.Td>Match {match.position}</Table.Td>
                    <Table.Td>{match.homeTeamName || 'TBD'}</Table.Td>
                    <Table.Td>{match.awayTeamName || 'TBD'}</Table.Td>
                    <Table.Td>
                      {match.isCompleted && match.homeScore !== undefined && match.awayScore !== undefined
                        ? `${match.homeScore} - ${match.awayScore}`
                        : '-'
                      }
                    </Table.Td>
                    <Table.Td>
                      {match.winnerName ? (
                        <Badge color="green" variant="light">
                          {match.winnerName}
                        </Badge>
                      ) : (
                        <Text size="sm" c="dimmed">TBD</Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        ) : (
          <Paper p="xl">
            <Center>
              <Text c="dimmed">No bracket data available</Text>
            </Center>
          </Paper>
        )}
      </Modal>
    </Container>
  );
}
