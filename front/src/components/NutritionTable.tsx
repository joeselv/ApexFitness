import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box } from '@mui/material';

interface DailyFoodItem {
  id: number;
  name: string;
  quantity: string;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  sodium: number;
  sugar: number;
  date: string;
}

interface NutritionTableProps {
  foodData: DailyFoodItem[];
  summation?: boolean;
  mealName?: string;
  onDelete?: (id: number) => void;
}

const NutritionTable: React.FC<NutritionTableProps> = ({ foodData, summation = false, mealName, onDelete }) => {
  if (foodData.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2, borderRadius: 5, width: '98%' }}>
        <Box sx={{ padding: 2, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            Nothing Logged Yet
          </Typography>
        </Box>
      </Paper>
    );
  }

  let total = {
    name: mealName || 'Total',
    calories: 0,
    carbs: 0,
    fat: 0,
    protein: 0,
    sodium: 0,
    sugar: 0
  };

  total = foodData.reduce(
    (acc, item) => {
      acc.calories += item.calories;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      acc.protein += item.protein;
      acc.sodium += item.sodium;
      acc.sugar += item.sugar;
      return acc;
    },
    total
  );

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 5, width: '98%' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '30%' }}><Typography fontWeight="bold">Food</Typography></TableCell>
              <TableCell align="right" sx={{ width: '20%' }}><Typography fontWeight="bold">Quantity</Typography></TableCell>
              <TableCell align="right" sx={{ width: '10%' }}><Typography fontWeight="bold">Calories</Typography></TableCell>
              <TableCell align="right" sx={{ width: '10%' }}><Typography fontWeight="bold">Carbs</Typography></TableCell>
              <TableCell align="right" sx={{ width: '10%' }}><Typography fontWeight="bold">Fat</Typography></TableCell>
              <TableCell align="right" sx={{ width: '10%' }}><Typography fontWeight="bold">Protein</Typography></TableCell>
              <TableCell align="right" sx={{ width: '10%' }}><Typography fontWeight="bold">Sodium</Typography></TableCell>
              <TableCell align="right" sx={{ width: '10%' }}><Typography fontWeight="bold">Sugar</Typography></TableCell>
              {!summation && onDelete && <TableCell align="center" sx={{ width: '5%' }}><Typography fontWeight="bold">Action</Typography></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {!summation && foodData.map((item) => (
              <TableRow key={item.id}>
                <TableCell sx={{ width: '30%' }}>{item.name}</TableCell>
                <TableCell align="right" sx={{ width: '20%' }}>{item.quantity}</TableCell>
                <TableCell align="right" sx={{ width: '10%' }}>{Math.round(item.calories)} cal</TableCell>
                <TableCell align="right" sx={{ width: '10%' }}>{Math.round(item.carbs)}g</TableCell>
                <TableCell align="right" sx={{ width: '10%' }}>{Math.round(item.fat)}g</TableCell>
                <TableCell align="right" sx={{ width: '10%' }}>{Math.round(item.protein)}g</TableCell>
                <TableCell align="right" sx={{ width: '10%' }}>{Math.round(item.sodium)}mg</TableCell>
                <TableCell align="right" sx={{ width: '10%' }}>{Math.round(item.sugar)}g</TableCell>
                {!summation && onDelete && (
                  <TableCell align="center" sx={{ width: '5%' }}>
                    <span
                      className="material-symbols-rounded"
                      style={{ cursor: "pointer", color: "red", userSelect: "none" }}
                      onClick={() => onDelete(item.id)}
                    >
                      delete
                    </span>
                  </TableCell>
                )}
              </TableRow>
            ))}

            <TableRow>
              <TableCell sx={{ width: '30%' }}>
                <Typography fontWeight={mealName ? 'normal' : 'bold'}>{total.name}</Typography>
              </TableCell>
              <TableCell align="right" sx={{ width: '20%' }}>{mealName ? '1 serving' : ''}</TableCell>
              <TableCell align="right" sx={{ width: '10%' }}>
                <Typography fontWeight={mealName ? 'normal' : 'bold'}>{Math.round(total.calories)} cal</Typography>
              </TableCell>
              <TableCell align="right" sx={{ width: '10%' }}>
                <Typography fontWeight={mealName ? 'normal' : 'bold'}>{Math.round(total.carbs)}g</Typography>
              </TableCell>
              <TableCell align="right" sx={{ width: '10%' }}>
                <Typography fontWeight={mealName ? 'normal' : 'bold'}>{Math.round(total.fat)}g</Typography>
              </TableCell>
              <TableCell align="right" sx={{ width: '10%' }}>
                <Typography fontWeight={mealName ? 'normal' : 'bold'}>{Math.round(total.protein)}g</Typography>
              </TableCell>
              <TableCell align="right" sx={{ width: '10%' }}>
                <Typography fontWeight={mealName ? 'normal' : 'bold'}>{Math.round(total.sodium)}mg</Typography>
              </TableCell>
              <TableCell align="right" sx={{ width: '10%' }}>
                <Typography fontWeight={mealName ? 'normal' : 'bold'}>{Math.round(total.sugar)}g</Typography>
              </TableCell>
              {!summation && onDelete && <TableCell />}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
export default NutritionTable;