import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Container, Typography, Box, Button } from '@mui/material';
import CustomDatePicker from '../components/DatePicker';
import NutritionTable from '../components/NutritionTable';
import axios from 'axios';
import { format, parseISO, isValid } from 'date-fns';


export interface DailyFoodItem {
  id: number;
  name: string;
  meal_type: string;
  quantity: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  sodium: number;
  sugar: number;
  date: string;
}

const ProgressDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  const [breakfastData, setBreakfastData] = useState<DailyFoodItem[]>([]);
  const [lunchData, setLunchData] = useState<DailyFoodItem[]>([]);
  const [dinnerData, setDinnerData] = useState<DailyFoodItem[]>([]);
  const [snackData, setSnackData] = useState<DailyFoodItem[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (dateParam) {
      const parsed = parseISO(dateParam);
      if (isValid(parsed)) return parsed;
    }
    return new Date();
  });

  useEffect(() => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      if (dateParam !== formattedDate) {
        setSearchParams({ date: formattedDate }, { replace: true });
      }
    }
  }, [selectedDate, dateParam, setSearchParams]);

  const fetchData = async () => {
    try {
      if (!selectedDate) return;
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      const fetchMealData = async (mealType: string) => {
        const response = await axios.get('/api/daily_food', {
          params: {
            date: formattedDate,
            meal_type: mealType,
          },
        });
        return response.data.result;
      };

      const [breakfast, lunch, dinner, snack] = await Promise.all([
        fetchMealData('breakfast'),
        fetchMealData('lunch'),
        fetchMealData('dinner'),
        fetchMealData('snack'),
      ]);

      setBreakfastData(breakfast);
      setLunchData(lunch);
      setDinnerData(dinner);
      setSnackData(snack);
    } catch (error) {
      console.error('Error fetching daily food data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/daily_food/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting item', error);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mb: 4 }}>
      <Box display="flex" flexDirection="column" alignItems="center">
        <Box sx={{ mb: 2 }}>
          <CustomDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        </Box>

        <Box
          sx={{
            mb: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              Breakfast
            </Typography>
            <Link to={`/add-food?mealType=breakfast&date=${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}`}>
              <Button variant="contained" className="primary-button">
                Add Breakfast
              </Button>
            </Link>
          </Box>
          <NutritionTable foodData={breakfastData} onDelete={handleDelete} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              Lunch
            </Typography>
            <Link to={`/add-food?mealType=lunch&date=${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}`}>
              <Button variant="contained" className="primary-button">
                Add Lunch
              </Button>
            </Link>
          </Box>
          <NutritionTable foodData={lunchData} onDelete={handleDelete} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              Dinner
            </Typography>
            <Link to={`/add-food?mealType=dinner&date=${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}`}>
              <Button variant="contained" className="primary-button">
                Add Dinner
              </Button>
            </Link>
          </Box>
          <NutritionTable foodData={dinnerData} onDelete={handleDelete} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              Snacks
            </Typography>
            <Link to={`/add-food?mealType=snack&date=${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}`}>
              <Button variant="contained" className="primary-button">
                Add Snack
              </Button>
            </Link>
          </Box>
          <NutritionTable foodData={snackData} onDelete={handleDelete} />

          <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
            Total
          </Typography>
          <NutritionTable foodData={[...breakfastData, ...lunchData, ...dinnerData, ...snackData]} summation={true} />
        </Box>
      </Box>
    </Container>
  );
};

export default ProgressDashboard;