import {
  Container,
  Title,
  Button,
  Card,
  Text,
  Group,
  Stack,
  Modal,
  TextInput,
  Avatar,
  Loader,
  Center,
  Paper,
  Alert,
  Grid,
  Divider,
  Badge,
} from '@mantine/core';
import {
  IconEdit,
  IconUsers,
  IconInfoCircle,
  IconTrophy,
  IconTarget,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../services/api';
import type { UpdateTeamDto } from '../types';
import { useAuth } from '../context/AuthContext';
import { TeamCreationModal } from '../components/TeamCreationModal';

export function MyTeam() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editModalOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [createModalOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);

  // Query to get user's team
  const { data: team, isLoading, error } = useQuery({
    queryKey: ['teams', 'my-team'],
    queryFn: () => teamApi.getMyTeam().then(res => res.data),
    enabled: !!user,
    retry: false, // Don't retry if user doesn't have a team
  });

  // Update team mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateTeamDto) => {
      if (!team) throw new Error('No team to update');
      return teamApi.update(team.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', 'my-team'] });
      notifications.show({
        title: 'Success',
        message: 'Team updated successfully',
        color: 'green',
      });
      closeEdit();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update team';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  // Form for editing team
  const form = useForm({
    initialValues: {
      name: team?.name || '',
      logoUrl: team?.logoUrl || '',
    },
    validate: {
      name: (value: string) => value.length < 2 ? 'Team name must have at least 2 characters' : null,
    },
  });

  const handleEditTeam = () => {
    if (team) {
      form.setValues({
        name: team.name,
        logoUrl: team.logoUrl || '',
      });
      openEdit();
    }
  };

  const handleSubmit = (values: typeof form.values) => {
    updateMutation.mutate(values);
  };

  const handleTeamCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['teams', 'my-team'] });
    closeCreate();
  };

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<IconInfoCircle size={16} />} title="Authentication Required" color="yellow">
          Please sign in to view your team.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  // User doesn't have a team
  if (error || !team) {
    return (
      <>
        <Container size="md" py="xl">
          <Paper p="xl" radius="md" withBorder>
            <Center>
              <Stack align="center" gap="md">
                <IconUsers size={64} color="gray" />
                <Title order={2} c="dimmed">You don't have a team yet</Title>
                <Text size="md" c="dimmed" ta="center">
                  Create your team to participate in tournaments and compete with other players!
                </Text>
                <Button 
                  leftSection={<IconUsers size={16} />}
                  size="lg"
                  onClick={openCreate}
                >
                  Create Your Team
                </Button>
              </Stack>
            </Center>
          </Paper>
        </Container>
        
        <TeamCreationModal
          opened={createModalOpened}
          onClose={closeCreate}
          onTeamCreated={handleTeamCreated}
        />
      </>
    );
  }

  return (
    <>
      <Container size="lg" py="xl">
        <Group justify="space-between" mb="xl">
          <Title order={1}>My Team</Title>
          <Button 
            leftSection={<IconEdit size={16} />}
            variant="light"
            onClick={handleEditTeam}
          >
            Edit Team
          </Button>
        </Group>

        <Grid>
          {/* Team Info Card */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card shadow="sm" padding="xl" radius="md" withBorder>
              <Group gap="xl" align="flex-start">
                <Avatar 
                  src={team.logoUrl} 
                  size={120} 
                  radius="md"
                  color="blue"
                >
                  <IconUsers size={40} />
                </Avatar>
                
                <Stack gap="md" style={{ flex: 1 }}>
                  <div>
                    <Title order={2}>{team.name}</Title>
                    <Text size="sm" c="dimmed">
                      Team Owner: {team.ownerName}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Created: {new Date(team.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                  
                  <Divider />
                  
                  <Group gap="lg">
                    <div>
                      <Text size="lg" fw={700} c="blue">{team.totalMatches}</Text>
                      <Text size="sm" c="dimmed">Total Matches</Text>
                    </div>
                    <div>
                      <Text size="lg" fw={700} c="green">{team.wins}</Text>
                      <Text size="sm" c="dimmed">Wins</Text>
                    </div>
                    <div>
                      <Text size="lg" fw={700} c="red">{team.losses}</Text>
                      <Text size="sm" c="dimmed">Losses</Text>
                    </div>
                    <div>
                      <Text size="lg" fw={700} c="orange">
                        {(team.winRate * 100).toFixed(1)}%
                      </Text>
                      <Text size="sm" c="dimmed">Win Rate</Text>
                    </div>
                  </Group>
                </Stack>
              </Group>
            </Card>
          </Grid.Col>

          {/* Stats Cards */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Group gap="md">
                  <IconTarget size={32} color="blue" />
                  <div>
                    <Text size="xl" fw={700}>{team.goalsFor}</Text>
                    <Text size="sm" c="dimmed">Goals For</Text>
                  </div>
                </Group>
              </Card>
              
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Group gap="md">
                  <IconTarget size={32} color="red" />
                  <div>
                    <Text size="xl" fw={700}>{team.goalsAgainst}</Text>
                    <Text size="sm" c="dimmed">Goals Against</Text>
                  </div>
                </Group>
              </Card>
              
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Group gap="md">
                  <IconTrophy size={32} color="yellow" />
                  <div>
                    <Text size="xl" fw={700}>
                      {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                    </Text>
                    <Text size="sm" c="dimmed">Goal Difference</Text>
                  </div>
                </Group>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Performance Summary */}
        <Card shadow="sm" padding="lg" radius="md" withBorder mt="xl">
          <Title order={3} mb="md">Performance Summary</Title>
          <Grid>
            <Grid.Col span={4}>
              <Center>
                <Stack align="center" gap="xs">
                  <Badge size="xl" color="green" variant="light">
                    {team.wins}
                  </Badge>
                  <Text size="sm" fw={500}>Victories</Text>
                </Stack>
              </Center>
            </Grid.Col>
            <Grid.Col span={4}>
              <Center>
                <Stack align="center" gap="xs">
                  <Badge size="xl" color="red" variant="light">
                    {team.losses}
                  </Badge>
                  <Text size="sm" fw={500}>Defeats</Text>
                </Stack>
              </Center>
            </Grid.Col>
            <Grid.Col span={4}>
              <Center>
                <Stack align="center" gap="xs">
                  <Badge size="xl" color="blue" variant="light">
                    {(team.winRate * 100).toFixed(0)}%
                  </Badge>
                  <Text size="sm" fw={500}>Win Rate</Text>
                </Stack>
              </Center>
            </Grid.Col>
          </Grid>
        </Card>
      </Container>

      {/* Edit Team Modal */}
      <Modal
        opened={editModalOpened}
        onClose={closeEdit}
        title="Edit Team"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Team Name"
              placeholder="Enter team name"
              required
              {...form.getInputProps('name')}
            />
            
            <TextInput
              label="Logo URL"
              placeholder="https://example.com/logo.png"
              {...form.getInputProps('logoUrl')}
            />

            <Group justify="flex-end" gap="md" mt="md">
              <Button variant="light" onClick={closeEdit}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Team
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}