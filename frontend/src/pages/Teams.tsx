import { useState } from 'react';
import {
  Container,
  Title,
  Button,
  Grid,
  Card,
  Text,
  Group,
  Stack,
  Modal,
  TextInput,
  Textarea,
  Avatar,
  ActionIcon,
  Menu,
  Loader,
  Center,
  Paper,
  Alert,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUsers,
  IconDots,
  IconSettings,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '../services/api';
import type { Team, CreateTeamDto, UpdateTeamDto } from '../types';
import { useAuth } from '../context/AuthContext';

export function Teams() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Queries
  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamApi.getAll().then(res => res.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateTeamDto) => teamApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      notifications.show({
        title: 'Success',
        message: 'Team created successfully',
        color: 'green',
      });
      close();
      form.reset();
      setEditingTeam(null);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create team';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamDto }) => teamApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      notifications.show({
        title: 'Success',
        message: 'Team updated successfully',
        color: 'green',
      });
      close();
      form.reset();
      setEditingTeam(null);
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      notifications.show({
        title: 'Success',
        message: 'Team deleted successfully',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete team';
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
      name: '',
      description: '',
      logoUrl: '',
    },
    validate: {
      name: (value: string) => value.length < 2 ? 'Team name must have at least 2 characters' : null,
    },
  });

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    form.setValues({
      name: team.name,
      description: team.description || '',
      logoUrl: team.iconUrl || team.logoUrl || '',
    });
    open();
  };

  const handleSubmit = (values: typeof form.values) => {
    const data: CreateTeamDto | UpdateTeamDto = {
      name: values.name,
      logoUrl: values.logoUrl || undefined,
    };

    if (editingTeam) {
      updateMutation.mutate({ id: editingTeam.id, data });
    } else {
      createMutation.mutate(data as CreateTeamDto);
    }
  };

  const handleCloseModal = () => {
    close();
    form.reset();
    setEditingTeam(null);
  };

  if (isLoading) {
    return (
      <Container size="xl" py="md">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="md">
        <Alert icon={<IconInfoCircle size={16} />} title="Error" color="red">
          Failed to load teams. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="lg">
        <Title order={1}>Teams</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Create Team
        </Button>
      </Group>

      <Grid>
        {teams.map((team) => (
          <Grid.Col key={team.id} span={{ base: 12, sm: 6, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Group>
                  <Avatar color="blue" radius="xl">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.name} />
                    ) : (
                      <IconUsers size={20} />
                    )}
                  </Avatar>
                  <div>
                    <Text fw={500} size="lg">{team.name}</Text>
                    <Text size="sm" c="dimmed">
                      by {team.ownerName || 'Unknown'}
                    </Text>
                  </div>
                </Group>
                
                {user?.id === team.ownerId && (
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => handleEdit(team)}
                      >
                        Edit Team
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconSettings size={14} />}
                      >
                        Manage Members
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={() => deleteMutation.mutate(team.id)}
                      >
                        Delete Team
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                )}
              </Group>

              <Stack gap="md">
                {team.description && (
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {team.description}
                  </Text>
                )}

                <Group justify="space-between">
                  <Group gap="xs">
                    <IconUsers size={16} />
                    <Text size="sm">
                      {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    Created {new Date(team.createdAt).toLocaleDateString()}
                  </Text>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {teams.length === 0 && (
        <Paper p="xl" radius="md" withBorder>
          <Center>
            <Stack align="center" gap="md">
              <IconUsers size={48} color="gray" />
              <Text size="lg" c="dimmed">No teams yet</Text>
              <Text size="sm" c="dimmed">Create your first team to get started!</Text>
              <Button leftSection={<IconPlus size={16} />} onClick={open}>
                Create Team
              </Button>
            </Stack>
          </Center>
        </Paper>
      )}

      {/* Create/Edit Team Modal */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={editingTeam ? 'Edit Team' : 'Create Team'}
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

            <Textarea
              label="Description"
              placeholder="Enter team description"
              {...form.getInputProps('description')}
            />

            <TextInput
              label="Logo URL"
              placeholder="Enter logo URL (optional)"
              {...form.getInputProps('logoUrl')}
            />

            <Group justify="flex-end" gap="md">
              <Button variant="light" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingTeam ? 'Update' : 'Create'} Team
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
