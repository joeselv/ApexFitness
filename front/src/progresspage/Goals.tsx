import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Tooltip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import axios from 'axios';
import EditableWeightCircle from './EditableWeightCircle';
import EditableStatCard from './EditableStatCard';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { format } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  calculateCalorieMetrics,
  CalorieResults,
  GoalType
} from '../utils/CalorieCalculations';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers';


interface WeightMetrics {
  current_weight: number | null;
  goal_weight: number | null;
  height: number | null;
  age: number | null;
  activity_level: string | null;
  gender: 'male' | 'female' | null;
}
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, ChartTooltip, Legend);

interface ProgressEntry {
  date: string;
  weight: number;
}

const WeightMetricsUI: React.FC = () => {

  const [metrics, setMetrics] = useState<WeightMetrics>({
    current_weight: null,
    goal_weight: null,
    height: null,
    age: null,
    activity_level: null,
    gender: null,
  });

  const [calorieResults, setCalorieResults] = useState<CalorieResults>({
    bmr: null,
    tdee: null,
    dailyIntake: null,
    daysToGoal: null,
    macros: null,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchWeightHistory = async () => {
      try {
        const params: any = {};
        if (startDate) {
          params.start_date = format(startDate, 'yyyy-MM-dd');
        }
        if (endDate) {
          params.end_date = format(endDate, 'yyyy-MM-dd');
        }

        const response = await axios.get('/api/weight_history', {
          params,
          withCredentials: true,
        });
        const weightData: ProgressEntry[] = response.data.map((entry: any) => ({
          date: format(new Date(entry.date), 'MMM'), // Format as short month (e.g., 'May')
          weight: entry.weight,
        }));
        setProgressData(weightData);
      } catch (error) {
        console.error('Error fetching weight history:', error);
        setProgressData([]);
      }
    };

    async function fetchMetrics() {
      try {
        const response = await axios.get('/api/user', { withCredentials: true });
        const user = response.data;
        setMetrics({
          current_weight: user.current_weight,
          goal_weight: user.goal_weight,
          height: user.height,
          age: user.age,
          activity_level: user.activity_level,
          gender: user.gender,
        });
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Failed to load metrics.');
      } finally {
        setLoading(false);
      }
    }
    fetchWeightHistory();
    fetchMetrics();
  }, [startDate, endDate]);

  useEffect(() => {
    const { current_weight, goal_weight, height, age, activity_level, gender } = metrics;
    if (
      current_weight !== null &&
      goal_weight !== null &&
      height !== null &&
      age !== null &&
      activity_level !== null &&
      gender !== null
    ) {
      const results = calculateCalorieMetrics(
        current_weight,
        goal_weight,
        height,
        age,
        activity_level,
        gender
      );
      setCalorieResults(results);
    } else {
      setCalorieResults({ bmr: null, tdee: null, dailyIntake: null, daysToGoal: null, macros: null });
    }
  }, [metrics]);

  const handleCurrentWeightChange = (newWeight: number | null) => {
    setMetrics((prev) => ({ ...prev, current_weight: newWeight }));
  };

  const handleGoalWeightChange = (newWeight: number | null) => {
    setMetrics((prev) => ({ ...prev, goal_weight: newWeight }));
  };

  const weightDifference =
    metrics.current_weight !== null && metrics.goal_weight !== null
      ? Math.abs(metrics.current_weight - metrics.goal_weight)
      : null;

  const getGoalType = (): GoalType => {
    if (
      metrics.current_weight === null ||
      metrics.goal_weight === null ||
      metrics.current_weight === metrics.goal_weight
    ) {
      return 'maintain';
    }
    return metrics.current_weight < metrics.goal_weight ? 'gain' : 'lose';
  };

  const handleSave = async () => {
    try {
      const payload: any = { ...metrics };
      // Include calculated targets if they exist
      if (calorieResults.dailyIntake && calorieResults.macros) {
        payload.target_calories = Math.round(calorieResults.dailyIntake);
        payload.target_protein = calorieResults.macros.protein;
        payload.target_fat = calorieResults.macros.fat;
        payload.target_carbs = calorieResults.macros.carbs;
      }

      const response = await axios.patch('/api/user/metrics', payload, { withCredentials: true, });
      if (response.status === 200) {
        console.log('Metrics updated successfully!', response.data);
      } else {
        console.error('Failed to update metrics.');
      }
    } catch (err) {
      console.error('Error updating metrics:', err);
    }
  };


  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const chartData = {
    labels: progressData.map((entry) => entry.date),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: progressData.map((entry) => entry.weight),
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
          width: '100%',
          margin: 'auto',
        }}
      >
        {/* Left Column: Calorie Info */}
        {calorieResults.dailyIntake !== null && (
          <Paper
            elevation={2}
            sx={{
              p: 3,
              width: '48%',
              textAlign: 'center',
              borderRadius: 10,
              minHeight: 500,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Calorie Plan
              <Tooltip
                title={
                  getGoalType() === 'lose'
                    ? 'This plan calculates your daily calorie needs for weight loss based on your BMR, TDEE, and a 500-calorie deficit.'
                    : getGoalType() === 'gain'
                      ? 'This plan calculates your daily calorie needs for muscle gain based on your BMR, TDEE, and a 250-calorie surplus.'
                      : 'This plan calculates your daily calorie needs to maintain your current weight based on your BMR and TDEE.'
                }
              >
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Typography>BMR: {calorieResults.bmr?.toFixed(0)} calories
              <Tooltip title="Basal Metabolic Rate: The number of calories your body burns at rest.">
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Typography>
              TDEE: {calorieResults.tdee?.toFixed(0)} calories
              <Tooltip title="Total Daily Energy Expenditure: Your BMR adjusted for your activity level.">
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Typography
              sx={{
                fontWeight: 'bold',
                fontSize: '1.2rem',
                mt: 1,
                mb: 1,
                color: '#3498db'
              }}
            >
              Daily Intake: {calorieResults.dailyIntake.toFixed(0)} calories{' '}
              {getGoalType() !== 'maintain' && (
                <>
                  ({getGoalType() === 'gain' ? '+250' : '-500'})
                </>
              )}
            </Typography>

            {calorieResults.macros && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Target Macros</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Protein</Typography>
                    <Typography variant="h6" color="#e74c3c">{calorieResults.macros.protein}g</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Carbs</Typography>
                    <Typography variant="h6" color="#f1c40f">{calorieResults.macros.carbs}g</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Fat</Typography>
                    <Typography variant="h6" color="#9b59b6">{calorieResults.macros.fat}g</Typography>
                  </Box>
                </Box>
              </Box>
            )}

            <Typography>
              Days to Goal: {calorieResults.daysToGoal?.toFixed(0)}
              {getGoalType() === 'gain' && (
                <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                  (Note: Realistic muscle gain may take longer, typically 1-2 lbs/month.)
                </Typography>
              )}
              <Tooltip
                title={
                  getGoalType() === 'gain'
                    ? 'Estimated days to gain your target muscle based on a maximum sustainable gain rate of 1-2 lbs/month.'
                    : 'Estimated days to lose your target weight based on a 500-calorie deficit.'
                }
              >
                <IconButton size="small" sx={{ ml: 0.5 }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {/* Days to Goal: {calorieResults.daysToGoal?.toFixed(0)} */}
            </Typography>
          </Paper>
        )}

        <Paper
          elevation={4}
          sx={{
            p: 4,
            width: '48%', // Adjust width to fit side by side
            textAlign: 'center',
            borderRadius: 15,
          }}
        >
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
            My Metrics
          </Typography>

          {/* Circles Row */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: 8,
              mb: 3,
            }}
          >
            {/* Current Weight */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 'bold', textTransform: 'uppercase' }}
              >
                Current
              </Typography>
              <EditableWeightCircle
                weight={metrics.current_weight}
                color="#ff0000"
                onChange={handleCurrentWeightChange}
              />
            </Box>

            {/* Goal Weight */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: 'bold', textTransform: 'uppercase' }}
              >
                Goal
              </Typography>
              <EditableWeightCircle
                weight={metrics.goal_weight}
                color="#0BDA51"
                onChange={handleGoalWeightChange}
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mb: 3,
            }}
          >
            {/* Height */}
            <EditableStatCard
              label="Height"
              value={metrics.height !== null ? metrics.height : ''}
              type="number"
              onChange={(val) => {
                setMetrics((prev) => ({
                  ...prev,
                  height: typeof val === 'number' ? val : null,
                }));
              }}
            />

            {/* Age */}
            <EditableStatCard
              label="Age"
              value={metrics.age !== null ? metrics.age : ''}
              type="number"
              onChange={(val) => {
                setMetrics((prev) => ({
                  ...prev,
                  age: typeof val === 'number' ? val : null,
                }));
              }}
            />

            {/* Activity Level */}
            <EditableStatCard
              label="Activity"
              value={metrics.activity_level || ''}
              type="select"
              selectOptions={['sedentary', 'light', 'moderate', 'active', 'very active']}
              onChange={(val) => {
                setMetrics((prev) => ({
                  ...prev,
                  activity_level: typeof val === 'string' ? val : null,
                }));
              }}
            />
            <EditableStatCard
              label="Gender"
              value={metrics.gender || ''}
              type="select"
              selectOptions={['male', 'female']}
              onChange={(val) => setMetrics((prev) => ({ ...prev, gender: typeof val === 'string' ? (val as 'male' | 'female') : null }))}
            />

          </Box>



          {weightDifference !== null && (
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 3 }}>
              {getGoalType() === 'maintain'
                ? 'Maintaining your current weight!'
                : `${weightDifference.toFixed(1)} pounds to ${getGoalType() === 'gain' ? 'gain' : 'lose'}!`}
            </Typography>
          )}

          {/* Save Button */}
          <Button
            variant="contained"
            size="large"
            sx={{ px: 4, py: 1.5, fontWeight: 'bold' }}
            onClick={handleSave}
            className='primary-button'
          >
            Save Metrics
          </Button>
        </Paper>
      </Box>
      <Box sx={{ mt: 4, mb: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue: Date | null) => setStartDate(newValue)}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newValue: Date | null) => setEndDate(newValue)}
          />
        </LocalizationProvider>
      </Box>

      {/* Weight Progress Card */}
      <Box display="flex" justifyContent="center" sx={{ mb: 4, margin: 'auto' }}>
        <Paper sx={{ p: 2, height: '30%', minHeight: '300px', width: 500, borderRadius: 5, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Weight Progress
          </Typography>
          {progressData.length > 0 ? (
            <Box sx={{ height: '30%', minHeight: 250, width: '100%' }}>
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      title: { display: true, text: 'Month' },
                    },
                    y: {
                      title: { display: true, text: 'Weight (lbs)' },
                      min: Math.min(...progressData.map((entry) => entry.weight)) - 10,
                      max: Math.max(...progressData.map((entry) => entry.weight)) + 10,
                    },
                  },
                }}
              />
            </Box>
          ) : (
            <Typography>No data available</Typography>
          )}
        </Paper>
      </Box>

    </Box>
  );
};

export default WeightMetricsUI;
