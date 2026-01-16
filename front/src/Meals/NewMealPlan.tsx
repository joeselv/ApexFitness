import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  TextField,
  Switch,
  List,
  ListItem,
} from '@mui/material';
import { UIDailyMeal, UIFormattedMealPlan } from '@apex/shared';
import LogFood from '../pages/LogFood';
import { Snackbar, Alert } from '@mui/material';

interface DailyFoodItem {
  id: number;
  name: string;
  mealPlanType: string;
  quantity: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  sodium: number;
  sugar: number;
  date: string;
  dayOfWeek: string;
}

const emptyMealPlan: UIFormattedMealPlan = {
  sunday: { breakfast: [], lunch: [], dinner: [], snack: [] },
  monday: { breakfast: [], lunch: [], dinner: [], snack: [] },
  tuesday: { breakfast: [], lunch: [], dinner: [], snack: [] },
  wednesday: { breakfast: [], lunch: [], dinner: [], snack: [] },
  thursday: { breakfast: [], lunch: [], dinner: [], snack: [] },
  friday: { breakfast: [], lunch: [], dinner: [], snack: [] },
  saturday: { breakfast: [], lunch: [], dinner: [], snack: [] },
};

function NewMealPlan() {
  const [mealPlan, setMealPlan] = useState<UIFormattedMealPlan>(emptyMealPlan);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [mealPlanName, setMealPlanName] = useState<string>('');
  const navigate = useNavigate();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('error');

  const days = Object.keys(mealPlan) as Array<keyof UIFormattedMealPlan>;
  const mealTypes: Array<keyof UIDailyMeal> = [
    'breakfast',
    'lunch',
    'dinner',
    'snack',
  ];

  function handlePublicModifier(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    setIsPublic(event.target.checked);
  }

  const handleFoodAdd = (newFood: DailyFoodItem) => {
    const { dayOfWeek, mealPlanType, ...foodItem } = newFood;
    const normalizedDay = dayOfWeek.toLowerCase() as keyof UIFormattedMealPlan;

    setMealPlan((prevMealPlan) => {
      if (!prevMealPlan[normalizedDay]) {
        console.error(`Invalid dayOfWeek: ${normalizedDay}`);
        return prevMealPlan;
      }

      const updatedDayMealPlan = { ...prevMealPlan[normalizedDay] };

      const normalizedMealPlanType = String(mealPlanType).toLowerCase() as keyof UIDailyMeal;

      updatedDayMealPlan[normalizedMealPlanType] = [
        ...(updatedDayMealPlan[normalizedMealPlanType] || []),
        { ...foodItem, mealPlanType: normalizedMealPlanType },
      ];

      console.log(updatedDayMealPlan);

      return {
        ...prevMealPlan,
        [normalizedDay]: updatedDayMealPlan,
      };
    });
  };

  const handleSaveMealPlan = async () => {
    const mealPlanData = {
      name: mealPlanName,
      is_private: !isPublic,
      meals: mealPlan,
    };

    try {
      const response = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealPlanData),
      });

      if (!response.ok) {
        throw new Error('Failed to save meal plan, ensure atleast one meal is added and a name is set');
      }

      const result = await response.json();
      console.log('Meal Plan Saved:', result);
      navigate(-1);
    } catch (error) {
      console.error('Error saving meal plan:', error);
      setSnackbarMessage((error as Error).message || 'Failed to save meal plan');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  useEffect(() => {
    console.log('Updated Meal Plan:', mealPlan);
  }, [mealPlan]);

  return (
    <div style={{ padding: '20px' }}>
      <LogFood onAddMealItem={handleFoodAdd} />
      <TextField
        label="Meal Plan Name"
        value={mealPlanName}
        onChange={(e) => setMealPlanName(e.target.value)}
        margin="normal"
        sx={{
          width: '30%',
        }}
        slotProps={{
          input: {
            style: {
              backgroundColor: 'white',
              borderRadius: '30px',
            },
          },
        }}
      />

      <TableContainer
        component={Paper}
        sx={{ borderRadius: '20px', overflow: 'hidden', width: '80%', margin: 'auto' }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Meal Type</strong>
              </TableCell>
              {days.map((day) => (
                <TableCell key={day} align="center">
                  <strong>{day.charAt(0).toUpperCase() + day.slice(1)}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {mealTypes.map((mealType) => (
              <TableRow key={mealType}>
                <TableCell>
                  <strong>
                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                  </strong>
                </TableCell>
                {days.map((day) => (
                  <TableCell key={day} align="center">
                    {mealPlan[day][mealType].length > 0 ? (
                      <List sx={{ listStyleType: 'disc', listStylePosition: 'inside', textAlign: 'center' }}>
                        {mealPlan[day][mealType].map((meal, idx) => (
                          <ListItem key={idx} sx={{ display: 'list-item', textAlign: 'center' }}>
                            {meal.name}
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        variant="contained"
        className='primary-button'
        onClick={() => {
          handleSaveMealPlan();
        }}
        sx={{ marginTop: '20px' }}
      >
        Save Meal Plan
      </Button>

      <div style={{ marginTop: '20px' }}>
        <Typography variant="h6">Public Visibility</Typography>
        <Switch
          checked={isPublic}
          onChange={handlePublicModifier}
          inputProps={{ 'aria-label': 'controlled' }}
        />
      </div>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default NewMealPlan;
