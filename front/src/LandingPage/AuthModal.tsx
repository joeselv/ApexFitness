import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { z } from 'zod';
import axios, { AxiosError } from 'axios';
import { getAxiosErrorMessages } from '@apex/shared';

// Define validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const registerSchema = loginSchema.extend({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
});

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  type: 'register' | 'login';
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, type }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: type === 'register' ? '' : undefined,
    password: '',
  });
  const [error, setError] = useState<string[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setValidationErrors({});

    const schema = type === 'register' ? registerSchema : loginSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setValidationErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      return;
    }

    try {
      const endpoint = type === 'register' ? '/api/register' : '/api/login';
      const response = await axios.post(endpoint, formData, {
        withCredentials: true,
      });

      console.log(`${type} successful:`, response.data);
      onClose();
      window.location.reload();
    } catch (err) {
      console.log(err);
      const axiosError = err as AxiosError;
      const status = axiosError.response?.status;
      if (status === 404 || status === 400) {
        setError(['Invalid username or password.']);
      } else {
        setError(getAxiosErrorMessages(err) || ['Something went wrong.']);
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ ...modalStyle, borderRadius: 10 }} onKeyDown={handleKeyDown}>
        <Box display="flex" justifyContent="space-between">
          <Typography variant="h6">
            {type === 'register' ? 'Register' : 'Login'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <TextField
          fullWidth
          margin="normal"
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={!!validationErrors.email}
          helperText={validationErrors.email}
        />
        {type === 'register' && (
          <TextField
            fullWidth
            margin="normal"
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={!!validationErrors.username}
            helperText={validationErrors.username}
          />
        )}
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={!!validationErrors.password}
          helperText={validationErrors.password}
        />

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        <Button
          fullWidth
          variant="contained"
          className='primary-button'
          onClick={handleSubmit}
          sx={{ mt: 2 }}
        >
          {type === 'register' ? 'Sign Up' : 'Log In'}
        </Button>
      </Box>
    </Modal>
  );
};

export default AuthModal;
