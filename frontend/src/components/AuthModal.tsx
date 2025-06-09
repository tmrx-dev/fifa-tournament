import { useState } from 'react';
import {
  Modal,
  Button,
  Stack,
  Alert,
} from '@mantine/core';
import { IconInfoCircle, IconBrandWindows, IconBrandGoogle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { googleAuthService } from '../services/googleAuth';

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AuthModal({ opened, onClose }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithMicrosoft } = useAuth();

  const handleMicrosoftSignIn = () => {
    signInWithMicrosoft();
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setError(null);
    googleAuthService.signIn();
  };

  const handleClose = () => {
    onClose();
    setError(null);
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Welcome to FIFA Tournament"
      centered
      size="md"
    >
      {error && (
        <Alert icon={<IconInfoCircle size={16} />} title="Error" color="red" mb="md">
          {error}
        </Alert>
      )}

      <Stack gap="md">
        <Button
          fullWidth
          leftSection={<IconBrandWindows size={16} />}
          variant="outline"
          onClick={handleMicrosoftSignIn}
          loading={isLoading}
        >
          Sign in with Microsoft
        </Button>

        <Button
          fullWidth
          leftSection={<IconBrandGoogle size={16} />}
          variant="outline"
          onClick={handleGoogleSignIn}
          loading={isLoading}
          color="red"
        >
          Sign in with Google
        </Button>
      </Stack>
    </Modal>
  );
}
