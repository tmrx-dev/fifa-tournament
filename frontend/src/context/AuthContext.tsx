import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authService } from '../services/authApi'
import { microsoftAuthService } from '../services/microsoftAuth'
import { teamApi } from '../services/api'
import type { User, CreateUserDto } from '../types'

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (userData: CreateUserDto) => Promise<void>
  signInWithMicrosoft: () => void
  logout: () => void
  isLoading: boolean
  hasTeam: boolean | null
  checkTeamStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasTeam, setHasTeam] = useState<boolean | null>(null)

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const user = await authService.validateToken(token)
          if (user) {
            setUser(user)
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('auth_token')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await authService.login(email, password)
      setUser(response.user)
      localStorage.setItem('auth_token', response.token)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: CreateUserDto) => {
    setIsLoading(true)
    try {
      const response = await authService.register(userData)
      setUser(response.user)
      localStorage.setItem('auth_token', response.token)
    } catch (error) {
      console.error('Register failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithMicrosoft = () => {
    microsoftAuthService.signInWithMicrosoft()
  }

  const checkTeamStatus = async () => {
    try {
      if (user) {
        const response = await teamApi.hasTeam()
        setHasTeam(response.data)
      }
    } catch (error) {
      console.error('Failed to check team status:', error)
      setHasTeam(null)
    }
  }

  const logout = () => {
    setUser(null)
    setHasTeam(null)
    localStorage.removeItem('auth_token')
    // Also sign out from Microsoft if applicable
    microsoftAuthService.signOut().catch(console.error)
  }

  const value = {
    user,
    setUser,
    login,
    register,
    signInWithMicrosoft,
    logout,
    isLoading,
    hasTeam,
    checkTeamStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
