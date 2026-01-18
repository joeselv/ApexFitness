import React, { useState } from 'react';
import { Box, Button, Typography, Card, CardContent, Container } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip
} from 'chart.js';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';
import AuthModal from './AuthModal';

// Register Chart.js components
Chart.register(LineElement, CategoryScale, LinearScale, PointElement, Filler, Tooltip);

const LandingPage: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authType, setAuthType] = useState<'register' | 'login'>('login');

  const handleOpenAuthModal = (type: 'register' | 'login') => {
    setAuthType(type);
    setAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
  };

  const progressData = [
    { date: 'May', weight: 225 },
    { date: 'Jun', weight: 223 },
    { date: 'Jul', weight: 222 },
    { date: 'Aug', weight: 221 },
    { date: 'Sep', weight: 220 },
    { date: 'Oct', weight: 219 },
    { date: 'Nov', weight: 217 },
    { date: 'Dec', weight: 215 },
    { date: 'Jan', weight: 211.5 },
  ];

  const chartData = {
    labels: progressData.map((entry) => entry.date),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: progressData.map((entry) => entry.weight),
        borderColor: '#6366f1', // Indigo
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#6366f1',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        displayColors: false,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280' }
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#6b7280' },
        border: { display: false }
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
        color: '#1e293b',
      }}
    >

      {/* Navbar */}
      <Box
        component={motion.div}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 4,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Logo - assuming logo.png exists */}
          <Box component="img" src="/logo.png" alt="Apex Tracker" sx={{ height: 40, width: 'auto' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', display: { xs: 'none', sm: 'block' } }}>
            Apex Fitness
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={() => handleOpenAuthModal('register')}
            sx={{
              color: '#64748b',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              '&:hover': { color: '#1e293b', backgroundColor: 'transparent' }
            }}
          >
            Register
          </Button>
          <Button
            variant="contained"
            onClick={() => handleOpenAuthModal('login')}
            sx={{
              borderRadius: '50px',
              px: 4,
              py: 1,
              backgroundColor: '#0f172a',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              '&:hover': { backgroundColor: '#334155', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }
            }}
          >
            Login
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, mt: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 8,
            px: { xs: 2, md: 6 },
          }}
        >
          {/* Left Text Content */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}
          >
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '3rem', md: '5rem' },
                lineHeight: 1.1,
                mb: 3,
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Master Your <br />
              <Box component="span" sx={{ color: '#6366f1', WebkitTextFillColor: '#6366f1' }}>Body & Mind</Box>
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: '#64748b',
                mb: 6,
                lineHeight: 1.6,
                fontWeight: 400,
                fontSize: { xs: '1.1rem', md: '1.4rem' }
              }}
            >
              Achieve your fitness goals with our premium wellness platform.
              Track nutrition, plan meals, and monitor progress—all in one beautiful interface.
            </Typography>

            <Button
              component={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              variant="contained"
              onClick={() => handleOpenAuthModal('register')}
              sx={{
                borderRadius: '50px',
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                backgroundColor: '#6366f1',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
                '&:hover': { backgroundColor: '#4f46e5' },
              }}
            >
              Get Started Free
            </Button>
          </Box>

          {/* Right Visual Content */}
          <Box
            sx={{ flex: 1, position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            {/* Background blur/glow for the visuals */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80%',
                height: '80%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(248,250,252,0) 70%)',
                filter: 'blur(40px)',
                zIndex: -1,
              }}
            />

            <Box sx={{ position: 'relative', width: '100%', height: 600 }}>
              {/* Floating Card 1: Graph */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, width: '60%' }}
              >
                <Card
                  sx={{
                    borderRadius: 6,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Weight Journey</Typography>
                    <Box sx={{ height: 200 }}>
                      <Line data={chartData} options={chartOptions} />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Floating Card 2: Image */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                style={{ position: 'absolute', top: 60, right: -20, zIndex: 4, width: '60%' }}
              >
                <Box
                  component="img"
                  src="/exampleEntry.png"
                  alt="Food Entry"
                  sx={{
                    width: '100%',
                    borderRadius: 6,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    transform: 'rotate(3deg)',
                    border: '6px solid white',
                  }}
                />
              </motion.div>

              {/* Floating Card 3: Circular Progress */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                style={{ position: 'absolute', bottom: 50, left: 40, zIndex: 3, width: '40%' }}
              >
                <Card
                  sx={{
                    borderRadius: 6,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    textAlign: 'center',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight={600} gutterBottom>
                      Daily Goal
                    </Typography>
                    <Box sx={{ width: 100, height: 100, mx: 'auto' }}>
                      <CircularProgressbar
                        value={775}
                        maxValue={2000}
                        text="775"
                        styles={buildStyles({
                          pathColor: '#6366f1',
                          textColor: '#1e293b',
                          trailColor: '#e2e8f0',
                          textSize: '24px',
                        })}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
                      kcal remaining
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          </Box>
        </Box>
      </Container>

      <AuthModal open={authModalOpen} onClose={handleCloseAuthModal} type={authType} />
    </Box>
  );
};

export default LandingPage;
