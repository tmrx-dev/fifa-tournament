import { Routes, Route } from 'react-router-dom'
import { AppShell, Burger, Group, Text, Button, Container } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconTrophy } from '@tabler/icons-react'
import { Home } from './pages/Home'
import { MyTeam } from './pages/MyTeam'
import { Tournaments } from './pages/Tournaments'
import { TournamentDetails } from './pages/TournamentDetails'
import { Profile } from './pages/Profile'
import { AuthCallback } from './pages/AuthCallback'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navigation } from './components/Navigation'
import { AuthModal } from './components/AuthModal'

function AppContent() {
  const [opened, { toggle }] = useDisclosure()
  const [authModalOpened, { open: openAuthModal, close: closeAuthModal }] = useDisclosure(false)
  const { user, logout } = useAuth()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group gap="xs">
              <IconTrophy size={24} color="blue" />
              <Text fw={600} size="lg">FIFA Tournament</Text>
            </Group>
          </Group>
          <Group>
            {user ? (
              <Group>
                <Text size="sm">Welcome, {user.displayName}</Text>
                <Button variant="light" onClick={logout}>
                  Sign Out
                </Button>
              </Group>
            ) : (
              <Button variant="light" onClick={openAuthModal}>Sign In</Button>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Navigation onNavigate={() => toggle()} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teams" element={<MyTeam />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id" element={<TournamentDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </Container>
      </AppShell.Main>

      <AuthModal opened={authModalOpened} onClose={closeAuthModal} />
    </AppShell>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
