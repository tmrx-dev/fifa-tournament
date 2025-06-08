import { useState } from 'react';
import {
  Modal,
  Button,
  TextInput,
  PasswordInput,
  Stack,
  Text,
  Anchor,
  Alert,
  Tabs,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconInfoCircle, IconBrandWindows, IconBrandGoogle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { googleAuthService } from '../services/googleAuth';
import type { CreateUserDto } from '../types';

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
}

export function AuthModal({ opened, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register, signInWithMicrosoft } = useAuth();

  const loginForm = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  });

  const registerForm = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
      confirmPassword: (value, values) => 
        value !== values.password ? 'Passwords do not match' : null,
      displayName: (value) => (value.length < 2 ? 'Display name must be at least 2 characters' : null),
    },
  });

  const handleLogin = async (values: typeof loginForm.values) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(values.email, values.password);
      onClose();
      loginForm.reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (values: typeof registerForm.values) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData: CreateUserDto = {
        email: values.email,
        displayName: values.displayName,
        avatarUrl: '', // Optional, empty for now
        externalProvider: 'local', // For mock auth, we'll use 'local' as provider
        externalId: crypto.randomUUID(), // Generate a unique external ID
      };
      await register(userData);
      onClose();
      registerForm.reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
    loginForm.reset();
    registerForm.reset();
    setActiveTab('login');
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Welcome to FIFA Tournament"
      centered
      size="md"
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List grow>
          <Tabs.Tab value="login">Sign In</Tabs.Tab>
          <Tabs.Tab value="register">Sign Up</Tabs.Tab>
        </Tabs.List>

        {error && (
          <Alert icon={<IconInfoCircle size={16} />} title="Error" color="red" mt="md">
            {error}
          </Alert>
        )}

        <Tabs.Panel value="login" pt="md">
          <form onSubmit={loginForm.onSubmit(handleLogin)}>
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

              <Divider label="or" labelPosition="center" />

              <TextInput
                label="Email"
                placeholder="Enter your email"
                required
                {...loginForm.getInputProps('email')}
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                required
                {...loginForm.getInputProps('password')}
              />

              <Button type="submit" fullWidth loading={isLoading}>
                Sign In
              </Button>

              <Text size="sm" ta="center" c="dimmed">
                Don't have an account?{' '}
                <Anchor component="button" type="button" onClick={() => setActiveTab('register')}>
                  Sign up here
                </Anchor>
              </Text>
            </Stack>
          </form>
        </Tabs.Panel>

        <Tabs.Panel value="register" pt="md">
          <form onSubmit={registerForm.onSubmit(handleRegister)}>
            <Stack gap="md">
              <Button
                fullWidth
                leftSection={<IconBrandWindows size={16} />}
                variant="outline"
                onClick={handleMicrosoftSignIn}
                loading={isLoading}
              >
                Sign up with Microsoft
              </Button>

              <Button
                fullWidth
                leftSection={<IconBrandGoogle size={16} />}
                variant="outline"
                onClick={handleGoogleSignIn}
                loading={isLoading}
                color="red"
              >
                Sign up with Google
              </Button>

              <Divider label="or" labelPosition="center" />

              <TextInput
                label="Display Name"
                placeholder="Enter your display name"
                required
                {...registerForm.getInputProps('displayName')}
              />

              <TextInput
                label="Email"
                placeholder="Enter your email"
                required
                {...registerForm.getInputProps('email')}
              />

              <PasswordInput
                label="Password"
                placeholder="Enter your password"
                required
                {...registerForm.getInputProps('password')}
              />

              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm your password"
                required
                {...registerForm.getInputProps('confirmPassword')}
              />

              <Button type="submit" fullWidth loading={isLoading}>
                Sign Up
              </Button>

              <Text size="sm" ta="center" c="dimmed">
                Already have an account?{' '}
                <Anchor component="button" type="button" onClick={() => setActiveTab('login')}>
                  Sign in here
                </Anchor>
              </Text>
            </Stack>
          </form>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
