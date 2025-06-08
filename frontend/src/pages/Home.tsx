import {
  Container,
  Title,
  Text,
  Card,
  Button,
  Stack,
  Group,
  Badge,
  SimpleGrid,
  Loader,
  Center,
} from '@mantine/core';
import {
  IconTrophy,
  IconUsers,
  IconCalendar,
  IconChevronRight,
  IconUser,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { teamApi, tournamentApi } from '../services/api';
import { TournamentStatus } from '../types';
import type { Tournament, Team } from '../types';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Queries
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamApi.getAll().then((res: { data: Team[] }) => res.data),
  });

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentApi.getAll().then((res: { data: Tournament[] }) => res.data),
  });

  // Calculate stats
  const activeTournaments = tournaments.filter((t: Tournament) => 
    t.status === TournamentStatus.InProgress || t.status === TournamentStatus.Open
  );
  const inProgressTournaments = tournaments.filter((t: Tournament) => 
    t.status === TournamentStatus.InProgress
  );

  const stats = [
    { 
      label: 'Active Tournaments', 
      value: activeTournaments.length.toString(), 
      icon: IconTrophy, 
      color: 'blue' 
    },
    { 
      label: 'Total Teams', 
      value: teams.length.toString(), 
      icon: IconUsers, 
      color: 'green' 
    },
    { 
      label: 'In Progress', 
      value: inProgressTournaments.length.toString(), 
      icon: IconCalendar, 
      color: 'orange' 
    },
  ];

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

  if (teamsLoading || tournamentsLoading) {
    return (
      <Container size="xl" py="md">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="sm">
            Welcome to FIFA Tournament
          </Title>
          <Text size="lg" c="dimmed">
            Create teams, join tournaments, and compete with friends in exciting FIFA matches!
          </Text>
          {user && (
            <Text size="md" mt="sm">
              Welcome back, <Text span fw={600}>{user.displayName}!</Text>
            </Text>
          )}
        </div>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} padding="lg" shadow="sm" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed" fw={500}>
                      {stat.label}
                    </Text>
                    <Text size="xl" fw={700}>
                      {stat.value}
                    </Text>
                  </div>
                  <Icon size={32} color={`var(--mantine-color-${stat.color}-6)`} />
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>

        {/* Quick Actions */}
        <Card padding="lg" shadow="sm" withBorder>
          <Title order={3} mb="md">Quick Actions</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <Button 
              variant="light" 
              fullWidth 
              leftSection={<IconUsers size={16} />}
              onClick={() => navigate('/teams')}
            >
              Create Team
            </Button>
            <Button 
              variant="light" 
              fullWidth
              leftSection={<IconTrophy size={16} />}
              onClick={() => navigate('/tournaments')}
            >
              Join Tournament
            </Button>
            <Button 
              variant="light" 
              fullWidth
              leftSection={<IconCalendar size={16} />}
              onClick={() => navigate('/tournaments')}
            >
              View Matches
            </Button>
            <Button 
              variant="light" 
              fullWidth
              leftSection={<IconUser size={16} />}
              onClick={() => navigate('/profile')}
            >
              My Profile
            </Button>
          </SimpleGrid>
        </Card>

        {/* Recent Tournaments */}
        <Card padding="lg" shadow="sm" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>Recent Tournaments</Title>
            <Button 
              variant="subtle" 
              rightSection={<IconChevronRight size={16} />}
              onClick={() => navigate('/tournaments')}
            >
              View All
            </Button>
          </Group>
          
          {tournaments.length > 0 ? (
            <Stack gap="sm">
              {tournaments.slice(0, 3).map((tournament: Tournament) => (
                <Card key={tournament.id} padding="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Text fw={600}>{tournament.name}</Text>
                      <Text size="sm" c="dimmed">
                        {tournament.teamCount}/{tournament.maxTeams} teams
                      </Text>
                      <Text size="xs" c="dimmed">
                        by {tournament.ownerName}
                      </Text>
                    </div>
                    <Stack align="flex-end" gap="xs">
                      {getStatusBadge(tournament.status)}
                      {tournament.prizePool > 0 && (
                        <Text size="xs" c="green" fw={600}>
                          ${tournament.prizePool} Prize
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              No tournaments yet. Create your first tournament to get started!
            </Text>
          )}
        </Card>

        {/* My Teams Preview */}
        {user && teams.length > 0 && (
          <Card padding="lg" shadow="sm" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={3}>My Teams</Title>
              <Button 
                variant="subtle" 
                rightSection={<IconChevronRight size={16} />}
                onClick={() => navigate('/teams')}
              >
                View All
              </Button>
            </Group>
            
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {teams.slice(0, 3).map((team: Team) => (
                <Card key={team.id} padding="sm" withBorder>
                  <Group gap="sm">
                    <IconUsers size={20} color="blue" />
                    <div>
                      <Text fw={500} size="sm">{team.name}</Text>
                      <Text size="xs" c="dimmed">
                        {team.memberCount} members
                      </Text>
                    </div>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
