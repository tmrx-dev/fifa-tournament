import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Text, Loader, Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { microsoftAuthService } from '../services/microsoftAuth';
import { teamApi } from '../services/api';
import { TeamCreationModal } from '../components/TeamCreationModal';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [authCompleted, setAuthCompleted] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');
        const provider = searchParams.get('provider') || 'microsoft'; // Default to Microsoft for backward compatibility
        
        // Check if there's an error from the OAuth flow
        if (error) {
          const errorMessage = provider === 'google' ? 
            `Google authentication failed: ${decodeURIComponent(error)}` :
            `Microsoft authentication failed: ${decodeURIComponent(error)}`;
          throw new Error(errorMessage);
        }
        
        if (!token) {
          throw new Error(`No authentication token received from ${provider}`);
        }

        // Exchange the token for user data using Microsoft auth service (both providers use same token exchange endpoint)
        const response = await microsoftAuthService.handleCallback(token);
        
        // Update auth state
        setUser(response.user);
        localStorage.setItem('auth_token', response.token);
        
        // Show success message based on provider
        console.log(`Successfully authenticated with ${provider}`);
        
        // Check if user has a team
        try {
          const hasTeamResponse = await teamApi.hasTeam();
          if (!hasTeamResponse.data) {
            // User doesn't have a team, show creation modal
            setAuthCompleted(true);
            setShowTeamModal(true);
            return;
          }
        } catch (teamError) {
          console.error('Failed to check team status:', teamError);
          // Continue to home page if team check fails
        }
        
        // Redirect to home page
        navigate('/', { replace: true });
      } catch (error: unknown) {
        console.error('OAuth callback failed:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        
        // Redirect to home page after a delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser]);

  const handleTeamCreated = () => {
    // Team was created successfully, redirect to home
    navigate('/', { replace: true });
  };

  const handleSkipTeamCreation = () => {
    // User skipped team creation, redirect to home anyway
    navigate('/', { replace: true });
  };

  if (error) {
    return (
      <Container size="sm" mt="xl">
        <Alert icon={<IconInfoCircle size={16} />} title="Authentication Error" color="red">
          {error}
          <Text size="sm" mt="sm">
            Redirecting you back to the home page...
          </Text>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Container size="sm" mt="xl" ta="center">
        {!authCompleted ? (
          <>
            <Loader size="lg" />
            <Text size="lg" mt="md">
              Completing authentication...
            </Text>
            <Text size="sm" c="dimmed" mt="sm">
              Please wait while we sign you in.
            </Text>
          </>
        ) : (
          <>
            <Text size="lg" mt="md">
              Welcome! Setting up your profile...
            </Text>
          </>
        )}
      </Container>
      
      <TeamCreationModal
        opened={showTeamModal}
        onClose={handleSkipTeamCreation}
        onTeamCreated={handleTeamCreated}
      />
    </>
  );
}
