import React, { useState } from 'react';
import { Modal, TextInput, Button, Stack, Title, Text } from '@mantine/core';
import { teamApi } from '../services/api';
import { notifications } from '@mantine/notifications';
import type { CreateTeamDto } from '../types';

interface TeamCreationModalProps {
  opened: boolean;
  onClose: () => void;
  onTeamCreated?: () => void;
}

export function TeamCreationModal({ opened, onClose, onTeamCreated }: TeamCreationModalProps) {
  const [teamName, setTeamName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Team name is required',
        color: 'red',
      });
      return;
    }

    setLoading(true);

    try {
      const createTeamDto: CreateTeamDto = {
        name: teamName.trim(),
        logoUrl: logoUrl.trim() || undefined,
      };

      await teamApi.create(createTeamDto);
      
      notifications.show({
        title: 'Success',
        message: 'Team created successfully!',
        color: 'green',
      });

      // Reset form
      setTeamName('');
      setLogoUrl('');
      
      onTeamCreated?.();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create team';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Title order={3}>Create Your Team</Title>
      }
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Welcome! You need to create a team to participate in tournaments.
        </Text>
        
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Team Name"
              placeholder="Enter your team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              maxLength={100}
            />
            
            <TextInput
              label="Logo URL (optional)"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              maxLength={500}
            />
            
            <Button 
              type="submit" 
              loading={loading}
              fullWidth
              disabled={!teamName.trim()}
            >
              Create Team
            </Button>
          </Stack>
        </form>
      </Stack>
    </Modal>
  );
}