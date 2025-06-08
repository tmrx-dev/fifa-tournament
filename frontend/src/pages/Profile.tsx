import {
  Container,
  Title,
  Card,
  Text,
  Group,
  Stack,
  Button,
  TextInput,
  Avatar,
  Badge,
  Grid,
  Tabs,
  Table,
  ActionIcon,
  Modal,
  Loader,
  Center,
  Paper,
  Divider,
  Alert,
} from '@mantine/core';
import {
  IconUser,
  IconEdit,
  IconTrophy,
  IconUsers,
  IconCalendar,
  IconSettings,
  IconLogout,
  IconMail,
  IconId,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, teamApi, tournamentApi } from '../services/api';
import type { UpdateUserDto } from '../types';
import { TournamentStatus } from '../types';
import { useAuth } from '../context/AuthContext';

export function Profile() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [editModalOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  // Queries
  const { data: userTeam, isLoading: teamLoading } = useQuery({
    queryKey: ['teams', 'my-team'],
    queryFn: () => teamApi.getMyTeam().then(res => res.data),
    enabled: !!user,
    retry: false, // Don't retry if user doesn't have a team
  });

  const { data: userTournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments', 'user', user?.id],
    queryFn: () => user ? tournamentApi.getByUserId(user.id).then(res => res.data) : [],
    enabled: !!user,
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserDto) => user ? userApi.update(user.id, data) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
      });
      closeEdit();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update profile';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  // Form
  const form = useForm({
    initialValues: {
      displayName: user?.displayName || '',
    },
    validate: {
      displayName: (value: string) => value.length < 2 ? 'Display name must have at least 2 characters' : null,
    },
  });

  const handleEditProfile = () => {
    if (user) {
      form.setValues({
        displayName: user.displayName,
      });
      openEdit();
    }
  };

  const handleSubmit = (values: typeof form.values) => {
    updateMutation.mutate(values);
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
      <Badge color={colors[status]} variant="light" size="sm">
        {labels[status]}
      </Badge>
    );
  };

  // Calculate user stats
  const userStats = {
    hasTeam: !!userTeam,
    totalTournaments: userTournaments.length,
    completedTournaments: userTournaments.filter(t => t.status === TournamentStatus.Completed).length,
    activeTournaments: userTournaments.filter(t => t.status === TournamentStatus.InProgress).length,
  };

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconInfoCircle size={16} />} title="Authentication Required" color="yellow">
          Please sign in to view your profile.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Title order={1} mb="lg">Profile</Title>

      <Grid>
        {/* Profile Information Card */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack align="center" gap="md">
              <Avatar size={100} radius="50%" color="blue">
                <IconUser size={50} />
              </Avatar>
              
              <Stack align="center" gap="xs">
                <Title order={3}>{user.displayName}</Title>
                <Group gap="xs">
                  <IconMail size={16} color="gray" />
                  <Text size="sm" c="dimmed">{user.email}</Text>
                </Group>
                <Group gap="xs">
                  <IconId size={16} color="gray" />
                  <Text size="xs" c="dimmed" ff="monospace">{user.id}</Text>
                </Group>
                <Group gap="xs">
                  <IconCalendar size={16} color="gray" />
                  <Text size="sm" c="dimmed">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </Group>
              </Stack>

              <Divider w="100%" />

              <Stack align="stretch" gap="sm" w="100%">
                <Button
                  leftSection={<IconEdit size={16} />}
                  variant="light"
                  onClick={handleEditProfile}
                >
                  Edit Profile
                </Button>
                
                <Button
                  leftSection={<IconSettings size={16} />}
                  variant="subtle"
                  color="gray"
                >
                  Settings
                </Button>
                
                <Button
                  leftSection={<IconLogout size={16} />}
                  variant="subtle"
                  color="red"
                  onClick={logout}
                >
                  Sign Out
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Stats and Content */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          {/* Stats Cards */}
          <Grid mb="lg">
            <Grid.Col span={6}>
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Group gap="md">
                  <IconUsers size={32} color={userStats.hasTeam ? "blue" : "gray"} />
                  <div>
                    <Text size="xl" fw={700}>{userStats.hasTeam ? "✓" : "✗"}</Text>
                    <Text size="sm" c="dimmed">Team Created</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Group gap="md">
                  <IconTrophy size={32} color="orange" />
                  <div>
                    <Text size="xl" fw={700}>{userStats.totalTournaments}</Text>
                    <Text size="sm" c="dimmed">Tournaments Created</Text>
                  </div>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Tabs for detailed info */}
          <Tabs defaultValue="team" variant="outline">
            <Tabs.List>
              <Tabs.Tab value="team">My Team</Tabs.Tab>
              <Tabs.Tab value="tournaments">My Tournaments</Tabs.Tab>
              <Tabs.Tab value="activity">Recent Activity</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="team" pt="md">
              {teamLoading ? (
                <Center p="xl">
                  <Loader size="lg" />
                </Center>
              ) : userTeam ? (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="sm" style={{ flex: 1 }}>
                      <Group gap="md">
                        {userTeam.logoUrl && (
                          <Avatar src={userTeam.logoUrl} size="lg" radius="md" />
                        )}
                        <div>
                          <Text size="xl" fw={600}>{userTeam.name}</Text>
                          <Text size="sm" c="dimmed">
                            Created {new Date(userTeam.createdAt).toLocaleDateString()}
                          </Text>
                        </div>
                      </Group>
                      
                      <Divider />
                      
                      <Grid>
                        <Grid.Col span={6}>
                          <Text size="sm" c="dimmed">Total Matches</Text>
                          <Text size="lg" fw={500}>{userTeam.totalMatches}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="sm" c="dimmed">Win Rate</Text>
                          <Text size="lg" fw={500}>{(userTeam.winRate * 100).toFixed(1)}%</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="sm" c="dimmed">Goals For</Text>
                          <Text size="lg" fw={500}>{userTeam.goalsFor}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <Text size="sm" c="dimmed">Goals Against</Text>
                          <Text size="lg" fw={500}>{userTeam.goalsAgainst}</Text>
                        </Grid.Col>
                      </Grid>
                    </Stack>
                    
                    <ActionIcon variant="subtle" size="lg">
                      <IconEdit size={20} />
                    </ActionIcon>
                  </Group>
                </Card>
              ) : (
                <Paper p="xl" radius="md" withBorder>
                  <Center>
                    <Stack align="center" gap="md">
                      <IconUsers size={48} color="gray" />
                      <Text size="lg" c="dimmed">No team created yet</Text>
                      <Text size="sm" c="dimmed">You need to create a team to participate in tournaments!</Text>
                      <Button leftSection={<IconUsers size={16} />}>
                        Create Team
                      </Button>
                    </Stack>
                  </Center>
                </Paper>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="tournaments" pt="md">
              {tournamentsLoading ? (
                <Center p="xl">
                  <Loader size="lg" />
                </Center>
              ) : userTournaments.length > 0 ? (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Tournament Name</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Teams</Table.Th>
                      <Table.Th>Prize Pool</Table.Th>
                      <Table.Th>Start Date</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {userTournaments.map((tournament) => (
                      <Table.Tr key={tournament.id}>
                        <Table.Td>
                          <div>
                            <Text fw={500}>{tournament.name}</Text>
                            {tournament.description && (
                              <Text size="xs" c="dimmed">{tournament.description}</Text>
                            )}
                          </div>
                        </Table.Td>
                        <Table.Td>{getStatusBadge(tournament.status)}</Table.Td>
                        <Table.Td>{tournament.teamCount}/{tournament.maxTeams}</Table.Td>
                        <Table.Td>${tournament.prizePool}</Table.Td>
                        <Table.Td>{new Date(tournament.startDate).toLocaleDateString()}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : (
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

            <Tabs.Panel value="activity" pt="md">
              <Paper p="xl" radius="md" withBorder>
                <Center>
                  <Stack align="center" gap="md">
                    <IconCalendar size={48} color="gray" />
                    <Text size="lg" c="dimmed">Activity feed coming soon</Text>
                    <Text size="sm" c="dimmed">Track your recent actions and achievements here</Text>
                  </Stack>
                </Center>
              </Paper>
            </Tabs.Panel>
          </Tabs>
        </Grid.Col>
      </Grid>

      {/* Edit Profile Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEdit}
        title="Edit Profile"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Display Name"
              placeholder="Enter your display name"
              required
              {...form.getInputProps('displayName')}
            />

            <Group justify="flex-end" gap="md" mt="md">
              <Button variant="light" onClick={closeEdit}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Profile
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
