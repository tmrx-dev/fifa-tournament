import { NavLink, useLocation } from 'react-router-dom'
import { Stack, Text, Group } from '@mantine/core'
import { 
  IconHome, 
  IconUsers, 
  IconTrophy, 
  IconUser 
} from '@tabler/icons-react'

interface NavigationProps {
  onNavigate?: () => void
}

const navItems = [
  { path: '/', label: 'Home', icon: IconHome },
  { path: '/teams', label: 'My Team', icon: IconUsers },
  { path: '/tournaments', label: 'Tournaments', icon: IconTrophy },
  { path: '/profile', label: 'Profile', icon: IconUser },
]

export function Navigation({ onNavigate }: NavigationProps) {
  const location = useLocation()

  return (
    <Stack gap="xs">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            style={{
              textDecoration: 'none',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: isActive ? '#e3f2fd' : 'transparent',
              color: isActive ? '#1976d2' : '#666',
              transition: 'all 0.2s ease',
            }}
          >
            <Group gap="sm">
              <Icon size={20} />
              <Text size="sm" fw={isActive ? 600 : 400}>
                {item.label}
              </Text>
            </Group>
          </NavLink>
        )
      })}
    </Stack>
  )
}
