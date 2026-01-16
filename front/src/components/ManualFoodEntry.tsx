import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Snackbar } from "@mui/material";
import { Alert } from "@mui/material";

interface AddFoodPopupProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: string;
  date: string;
}

const AddFoodPopup: React.FC<AddFoodPopupProps> = ({ isOpen, onClose, mealType, date }) => {
  const navigate = useNavigate();
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [protein, setProtein] = useState("");
  const [sodium, setSodium] = useState("");
  const [sugar, setSugar] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);  // Error state

  const handleSubmit = async () => {
    if (!foodName || !calories || !carbs || !fat || !protein || !sodium || !sugar || !quantity) {
      setError("All fields must be filled");
      return;
    }

    try {
      await axios.post("/api/daily_food", {
        meal_type: mealType,
        name: foodName,
        calories: Math.round(Number(calories)),
        carbs: Math.round(Number(carbs)),
        fat: Math.round(Number(fat)),
        protein: Math.round(Number(protein)),
        sodium: Math.round(Number(sodium)),
        sugar: Math.round(Number(sugar)),
        date: date,
        quantity,
      });
      onClose();
      navigate(date ? `/dashboard?date=${date}` : '/dashboard');
    } catch (error) {
      console.error("Error adding food:", error);
    }
  };

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <>
      {error && (
        <Snackbar open={true} autoHideDuration={6000} onClose={handleCloseError}>
          <Alert severity="error" onClose={handleCloseError}>
            {error}
          </Alert>
        </Snackbar>
      )}

      <Dialog
        open={isOpen}
        onClose={onClose}
        sx={{ "& .MuiPaper-root": { borderRadius: "20px" } }} // Rounded corners
      >
        <DialogTitle>Add Food Item</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label="Food Name" value={foodName} onChange={handleChange(setFoodName)} inputProps={{ maxLength: 50 }} />
          <TextField fullWidth margin="dense" label="Calories" type="number" value={calories} onChange={handleChange(setCalories)} />
          <TextField fullWidth margin="dense" label="Carbs (g)" type="number" value={carbs} onChange={handleChange(setCarbs)} />
          <TextField fullWidth margin="dense" label="Fat (g)" type="number" value={fat} onChange={handleChange(setFat)} />
          <TextField fullWidth margin="dense" label="Protein (g)" type="number" value={protein} onChange={handleChange(setProtein)} />
          <TextField fullWidth margin="dense" label="Sodium (mg)" type="number" value={sodium} onChange={handleChange(setSodium)} />
          <TextField fullWidth margin="dense" label="Sugar (g)" type="number" value={sugar} onChange={handleChange(setSugar)} />
          <TextField fullWidth margin="dense" label="Quantity (e.g. 1 cup)" value={quantity} onChange={handleChange(setQuantity)} inputProps={{ maxLength: 50 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained" className="primary-button">
            Add Food
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddFoodPopup;
