import { Box, TextField, Button, InputAdornment, Typography, Modal, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";
import { z } from "zod";
import searchIcon from "../assets/search.png";
import PopupNutrition from '../components/PopUpNutrition.tsx';
import NutritionTable from "../components/NutritionTable.tsx";
import ManualFoodEntryForm from "../components/ManualFoodEntry.tsx";

const FoodItemSchema = z.object({
  food_name: z.string(),
  brand_name: z.string().optional(),
  food_description: z.string(),
  food_url: z.string().url(),
  food_id: z.string(),
});

const NutrientSchema = z.object({
  calcium: z.coerce.number().optional().default(0),
  calories: z.coerce.number(),
  carbohydrate: z.coerce.number().optional().default(0),
  cholesterol: z.coerce.number().optional().default(0),
  fat: z.coerce.number().optional().default(0),
  fiber: z.coerce.number().optional().default(0),
  iron: z.coerce.number().optional().default(0),
  monounsaturated_fat: z.coerce.number().optional().default(0),
  polyunsaturated_fat: z.coerce.number().optional().default(0),
  potassium: z.coerce.number().optional().default(0),
  protein: z.coerce.number().optional().default(0),
  saturated_fat: z.coerce.number().optional().default(0),
  sodium: z.coerce.number().optional().default(0),
  sugar: z.coerce.number().optional().default(0),
  vitamin_a: z.coerce.number().optional().default(0),
  vitamin_c: z.coerce.number().optional().default(0),
  measurement_description: z.string().optional().default(""),
  metric_serving_amount: z.coerce.number().optional().default(0),
  metric_serving_unit: z.string().optional().default(""),
  serving_description: z.string().optional().default(""),
  serving_id: z.string().optional().default(""),
  serving_url: z.string().url().optional().default(""),
});

const FoodDetailSchema = z.object({
  food: z.object({
    brand_name: z.string().optional(),
    food_name: z.string(),
    food_url: z.string().url(),
    servings: z.object({
      serving: z.union([
        NutrientSchema,
        z.array(NutrientSchema)
      ])
    })
  })
});

const SearchResultsSchema = z.object({
  foods: z.object({
    food: z.array(FoodItemSchema).optional(),
  }).optional(),
});

const DailyFoodItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.string(),
  calories: z.number(),
  carbs: z.number(),
  fat: z.number(),
  protein: z.number(),
  sodium: z.number(),
  sugar: z.number(),
  date: z.string(),
});

const MealSchema = z.object({
  meal_id: z.number(),
  meal_name: z.string(),
  meal_date: z.string(),
  food_items: z.array(DailyFoodItemSchema),
});

const MealsSchema = z.array(MealSchema);

type SearchResults = z.infer<typeof SearchResultsSchema>;
type FoodItem = z.infer<typeof FoodItemSchema>;
type FoodDetail = z.infer<typeof FoodDetailSchema>;
type Meal = z.infer<typeof MealSchema>;

const LogFood = ({ onAddMealItem }: { onAddMealItem?: (foodItem: any) => void }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({});
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [foodDetail, setFoodDetail] = useState<FoodDetail | null>(null);
  const [servingSize, setServingSize] = useState("");
  const [numServings, setNumServings] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [fullNutrition, setFullNutrition] = useState<z.infer<typeof NutrientSchema> | null>(null);
  const [servingSizes, setServingSizes] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const mealType = searchParams.get('mealType');
  const date = searchParams.get('date');
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [mealPlanType, setMealPlanType] = useState("breakfast");
  const [savedMeals, setSavedMeals] = useState<Meal[]>([]);
  const [loadingSavedMeals, setLoadingSavedMeals] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<Meal | null>(null);

  useEffect(() => {
    if (!mealType || !["breakfast", "lunch", "dinner", "snack", "new-meal", "new-meal-plan"].includes(mealType)) {
      navigate('/not-found');
    }
  }, [mealType, navigate]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);

    if (value.length > 2) {
      setShowSearchButton(true);
    } else {
      setShowSearchButton(false);
    }
  };

  const handleSearch = async () => {
    if (query.length > 2) {
      try {
        const response = await axios.get(`/api/search-food`, {
          params: { query },
        });

        if (!response.data.foods?.food) {
          console.error("No food items found in the response.");
          return;
        }

        if (!Array.isArray(response.data.foods.food)) {
          response.data.foods.food = [response.data.foods.food];
        }

        const parsedResults = SearchResultsSchema.parse(response.data);
        setResults(parsedResults);
      } catch (error) {
        console.error("Error fetching food data:", error);
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleFoodClick = async (food: FoodItem) => {
    setSelectedFood(food);
    setNumServings("1");
    try {
      const response = await axios.get(`/api/food-detail`, {
        params: { foodId: food.food_id },
      });

      console.log("Food detail response:", response.data);

      const parsedDetail = FoodDetailSchema.parse(response.data);
      setFoodDetail(parsedDetail);

      const servings = parsedDetail.food.servings.serving;
      if (!servings) return;

      const servingArray = Array.isArray(servings) ? servings : [servings];

      const servingOptions = servingArray.map((serving) => serving.serving_description);
      setServingSizes(servingOptions);

      setServingSize(servingOptions[0]);
      setFullNutrition(servingArray[0]);
    } catch (error) {
      console.error("Error fetching food detail:", error);
    }
  };

  const handleServingSizeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const selectedSize = event.target.value as string;
    setServingSize(selectedSize);

    if (foodDetail) {
      const servings = foodDetail.food.servings.serving;
      const selectedServing = Array.isArray(servings)
        ? servings.find((serving) => serving.serving_description === selectedSize)
        : servings.serving_description === selectedSize
          ? servings
          : null;

      if (selectedServing) {
        console.log("Selected Serving:", selectedServing);
        setFullNutrition(selectedServing);
      }
    }
  };

  const handleNumServingsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNumServings(value);
  };

  const handleAddFood = async () => {
    if (!fullNutrition || !mealType) {
      console.error("No nutrition data or meal type selected");
      return;
    }

    try {
      const response = await axios.post('/api/daily_food', {
        meal_type: mealType,
        name: selectedFood?.food_name || "Unknown",
        calories: Math.round(fullNutrition.calories),
        carbs: Math.round(fullNutrition.carbohydrate),
        fat: Math.round(fullNutrition.fat),
        protein: Math.round(fullNutrition.protein),
        sodium: Math.round(fullNutrition.sodium),
        sugar: Math.round(fullNutrition.sugar),
        date: date || new Date().toLocaleDateString('en-CA'),
        quantity: `${numServings} x ${fullNutrition.serving_description}`,
      });

      console.log("Food added successfully:", response.data);
      navigate(date ? `/dashboard?date=${date}` : '/dashboard');
    } catch (error) {
      console.error("Error adding food:", error);
    }
  };

  const handleAddMealItem = () => {
    if (!fullNutrition || !selectedFood) return;

    const newMealItem = {
      name: selectedFood.food_name,
      calories: fullNutrition.calories,
      carbs: fullNutrition.carbohydrate,
      fat: fullNutrition.fat,
      protein: fullNutrition.protein,
      sodium: fullNutrition.sodium,
      sugar: fullNutrition.sugar,
      quantity: `${numServings} x ${fullNutrition.serving_description}`,
      ...(mealType === "new-meal-plan" && { dayOfWeek, mealPlanType }),
    };

    if (onAddMealItem) {
      onAddMealItem(newMealItem);
    }
  };

  const handleDeleteMeal = async (meal_id: number) => {
    try {
      const response = await axios.delete(`/api/meals/${meal_id}`);
      if (response.status === 200) {
        setSavedMeals((prevMeals) => prevMeals.filter((meal) => meal.meal_id !== meal_id));
      } else {
        console.error('Failed to delete meal:', response.data.error);
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const handleLogMeal = async (meal: Meal) => {
    if (!meal || !meal.food_items) return;

    const summedValues = meal.food_items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        protein: acc.protein + item.protein,
        sodium: acc.sodium + (item.sodium || 0),
        sugar: acc.sugar + (item.sugar || 0),
      }),
      { calories: 0, carbs: 0, fat: 0, protein: 0, sodium: 0, sugar: 0 }
    );

    const payload = {
      meal_type: mealType,
      name: meal.meal_name,
      date: date || new Date().toISOString().split('T')[0],
      quantity: "1 serving",
      ...summedValues,
    };

    try {
      const response = await axios.post('/api/daily_food', payload);
      console.log('Meal logged successfully:', response.data);
      navigate(date ? `/dashboard?date=${date}` : '/dashboard');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error logging meal:', error.response?.data || error.message);
      } else {
        console.error('Error logging meal:', error);
      }
    }
  };

  const handleAddMealItemToPlan = () => {
    if (!currentMeal || !currentMeal.food_items) return;

    const summedValues = currentMeal.food_items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        protein: acc.protein + item.protein,
        sodium: acc.sodium + (item.sodium || 0),
        sugar: acc.sugar + (item.sugar || 0),
      }),
      { calories: 0, carbs: 0, fat: 0, protein: 0, sodium: 0, sugar: 0 }
    );

    const newMealItem = {
      name: currentMeal.meal_name,
      calories: summedValues.calories,
      carbs: summedValues.carbs,
      fat: summedValues.fat,
      protein: summedValues.protein,
      sodium: summedValues.sodium,
      sugar: summedValues.sugar,
      quantity: "1 serving",
      dayOfWeek,
      mealPlanType,
    };

    if (onAddMealItem) {
      onAddMealItem(newMealItem);
    }
    handleCloseModal();
  };

  const handleOpenModal = (meal: Meal) => {
    setCurrentMeal(meal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDayOfWeek('');
    setMealPlanType('');
    setCurrentMeal(null);
  };

  useEffect(() => {
    if (!foodDetail) return;

    const servings = foodDetail.food.servings.serving;
    const selectedServing = Array.isArray(servings)
      ? servings.find((serving) => serving.serving_description === servingSize)
      : servings.serving_description === servingSize
        ? servings
        : null;

    if (selectedServing) {
      const multiplier = parseFloat(numServings) || 1;

      const updatedNutrition = {
        ...selectedServing,
        calories: selectedServing.calories * multiplier,
        carbohydrate: selectedServing.carbohydrate * multiplier,
        fat: selectedServing.fat * multiplier,
        protein: selectedServing.protein * multiplier,
        sodium: selectedServing.sodium * multiplier,
        sugar: selectedServing.sugar * multiplier,
        cholesterol: selectedServing.cholesterol * multiplier,
        saturated_fat: selectedServing.saturated_fat * multiplier,
        ...(selectedServing.fiber !== undefined && { fiber: selectedServing.fiber * multiplier }),
        ...(selectedServing.iron !== undefined && { iron: selectedServing.iron * multiplier }),
        ...(selectedServing.vitamin_a !== undefined && { vitamin_a: selectedServing.vitamin_a * multiplier }),
        ...(selectedServing.vitamin_c !== undefined && { vitamin_c: selectedServing.vitamin_c * multiplier }),
      };

      setFullNutrition(updatedNutrition);
    }
  }, [numServings, servingSize, foodDetail]);

  useEffect(() => {
    const fetchSavedMeals = async () => {
      try {
        const response = await axios.get('/api/meals');

        if (response.data && Array.isArray(response.data.meals)) {
          const parsedData = MealsSchema.safeParse(response.data.meals);

          if (parsedData.success) {
            setSavedMeals(parsedData.data);
          } else {
            console.error('Invalid data:', parsedData.error.format());
          }
        } else {
          console.error("The response does not contain a valid 'meals' array.");
        }
      } catch (error) {
        console.error('Error fetching saved meals:', error);
      } finally {
        setLoadingSavedMeals(false);
      }
    };

    fetchSavedMeals();
  }, []);

  if (loadingSavedMeals) {
    return <div>Loading saved meals...</div>;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        maxWidth: "1500px",
        margin: "auto",
      }}
    >
      <Typography variant="h4" component="h1" sx={{ marginBottom: "20px" }}>
        {mealType === "new-meal" ? "Create a new meal" : mealType === "new-meal-plan" ? "Create a new meal plan" : mealType ? `Add Food for ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}` : "Add Food"}
      </Typography>

      <TextField
        variant="outlined"
        placeholder="Search food database..."
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        sx={{
          borderRadius: "50px",
          backgroundColor: "white",
          "& .MuiOutlinedInput-root": {
            borderRadius: "50px",
            padding: "4px 12px",
          },
          "& .MuiInputBase-input": {
            padding: "10px 12px",
            height: "auto",
          },
          marginBottom: "20px",
        }}
        InputProps={{
          endAdornment: showSearchButton ? (
            <InputAdornment position="end">
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{
                  borderRadius: "50px",
                  padding: "10px",
                  minWidth: "40px",
                  minHeight: "40px",
                  backgroundColor: "#000000",
                  height: "auto",
                }}
              >
                <img
                  src={searchIcon}
                  alt="Search"
                  style={{ width: "24px", height: "24px" }}
                />
              </Button>
            </InputAdornment>
          ) : null,
        }}
      />

      {results.foods?.food && results.foods.food.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: "20px",
          }}
        >
          <Box
            sx={{
              width: "40%",
              padding: "10px",
              backgroundColor: "white",
              borderRadius: "30px",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
              overflowY: "auto",
              maxHeight: "400px",
            }}
          >
            {results.foods?.food?.map((result, index) => (
              <Box
                key={index}
                sx={{
                  padding: "10px",
                  borderBottom: "1px solid #ccc",
                  cursor: "pointer",
                  backgroundColor:
                    selectedFood?.food_id === result.food_id
                      ? "#b9e1fc"
                      : "transparent",
                  "&:hover": {
                    backgroundColor: "#d9f0ff",
                  },
                  borderRadius: "15px",
                }}
                onClick={() => handleFoodClick(result)}
              >
                <Box>
                  <Box>{result.food_name}</Box>
                  <Box sx={{ color: "gray", fontSize: "12px" }}>
                    {result.brand_name && `${result.brand_name} - `}
                    {result.food_description}
                  </Box>
                </Box>
              </Box>
            ))}
            <Box sx={{ padding: "10px", textAlign: "center", marginTop: "10px" }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setIsPopupOpen(true)}
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  width: "100%",
                  borderRadius: "20px",
                }}
              >
                Don't see one that fits? Add a custom entry.
              </Button>
            </Box>
          </Box>
          <ManualFoodEntryForm
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            mealType={mealType ?? ""}
            date={date ?? new Date().toLocaleDateString('en-CA')}
          />

          <Box
            sx={{
              width: "60%",
              padding: "10px",
              backgroundColor: "white",
              borderRadius: "30px",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
              textAlign: "left",
            }}
          >
            {selectedFood ? (
              <>
                <Box sx={{ fontWeight: "bold", fontSize: "32px" }}>
                  {selectedFood.food_name}
                </Box>

                <Box sx={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ fontWeight: "bold" }}>Serving Size</Box>
                    <TextField
                      select
                      variant="outlined"
                      value={servingSize}
                      onChange={handleServingSizeChange}
                      SelectProps={{
                        native: true,
                      }}
                      sx={{
                        backgroundColor: "#ffffff",
                        width: "300px",
                      }}
                    >
                      {servingSizes.map((size, index) => (
                        <option key={index} value={size}>
                          {size}
                        </option>
                      ))}
                    </TextField>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ fontWeight: "bold" }}>Number of Servings</Box>
                    <TextField
                      type="number"
                      variant="outlined"
                      value={numServings}
                      onChange={handleNumServingsChange}
                      inputProps={{ min: "1", style: { textAlign: "center", width: "50px" } }}
                    />
                  </Box>

                  {mealType === "new-meal-plan" && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <Typography sx={{ alignSelf: "center", fontWeight: "bold" }}>Day of the Week</Typography>
                        <TextField
                          select
                          label="Day of the Week"
                          value={dayOfWeek}
                          onChange={(e) => setDayOfWeek(e.target.value)}
                          SelectProps={{ native: true }}
                          sx={{ width: "200px" }}
                        >
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </TextField>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <Typography sx={{ alignSelf: "center", fontWeight: "bold" }}>Meal Type</Typography>
                        <TextField
                          select
                          label="Meal Type"
                          value={mealPlanType}
                          onChange={(e) => setMealPlanType(e.target.value)}
                          SelectProps={{ native: true }}
                          sx={{ width: "200px" }}
                        >
                          {["Breakfast", "Lunch", "Dinner", "Snack"].map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </TextField>
                      </Box>
                    </Box>
                  )}

                  {fullNutrition && (
                    <Box sx={{ marginTop: "20px" }}>
                      <Box sx={{ fontSize: "18px", fontWeight: "bold" }}>Nutritional Information</Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "10px" }}>
                        <Box>Calories: {Math.round(fullNutrition.calories)}</Box>
                        <Box>Carbs: {Math.round(fullNutrition.carbohydrate)}g</Box>
                        <Box>Fat: {Math.round(fullNutrition.fat)}g</Box>
                        <Box>Protein: {Math.round(fullNutrition.protein)}g</Box>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
                    <Button
                      variant="contained"
                      onClick={() => setOpenDialog(true)}
                      className="primary-button"
                    >
                      Full Nutrition
                    </Button>

                    {mealType === "new-meal" || mealType === "new-meal-plan" ? (
                      <Button
                        variant="contained"
                        onClick={handleAddMealItem}
                        className="primary-button"
                      >
                        Add to meal
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleAddFood}
                        className="primary-button"
                      >
                        Add Food
                      </Button>
                    )}
                  </Box>
                  <PopupNutrition
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    nutritionData={fullNutrition}
                  />
                </Box>
              </>
            ) : (
              <Box sx={{ fontSize: "18px", color: "#888" }}>
                Select a food item to see more details.
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Typography
        sx={{
          type: "caption",
          marginTop: "8px",
          color: "gray",
          textAlign: "left",
        }}
      >
        All nutritional data provided by <a href="https://www.fatsecret.com" target="_blank" rel="noopener noreferrer">FatSecret</a>
      </Typography>

      {mealType !== "new-meal" && mealType !== "new-meal-plan" && (
        <Box sx={{ mb: 4, mt: 4, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>Saved Meals</Typography>
            <Button
              variant="contained"
              sx={{ mb: 2 }}
              className='primary-button'
              onClick={() => navigate('/new-meal?mealType=new-meal')}
            >
              Add a New Meal
            </Button>
          </Box>

          {savedMeals.length > 0 ? (
            savedMeals.map((meal) => (
              <Box key={meal.meal_id} sx={{ width: '100%', mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <NutritionTable foodData={meal.food_items} summation={true} mealName={meal.meal_name} />
                <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: "40px", cursor: "pointer", marginBottom: "8px" }} onClick={() => handleLogMeal(meal)}>
                    add_circle
                  </span>
                  <span className="material-symbols-rounded" style={{ fontSize: "40px", cursor: "pointer" }} onClick={() => handleDeleteMeal(meal.meal_id)}>
                    delete
                  </span>
                </Box>
              </Box>
            ))
          ) : (
            <Box
              sx={{
                color: 'gray',
                fontWeight: 'bold',
                backgroundColor: 'white',
                padding: '50px',
                borderRadius: '20px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                width: "95%",
                fontSize: '2rem',
                textAlign: 'center',
              }}
            >
              No saved meals yet.
            </Box>
          )}
        </Box>
      )}

      {mealType === "new-meal-plan" && (
        <Box sx={{ mb: 4, mt: 4, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>New Meal Plan</Typography>
          {savedMeals.length > 0 ? (
            savedMeals.map((meal) => (
              <Box key={meal.meal_id} sx={{ width: '100%', mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <NutritionTable foodData={meal.food_items} summation={true} mealName={meal.meal_name} />
                <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: "40px", cursor: "pointer", marginBottom: "8px" }} onClick={() => handleOpenModal(meal)}>
                    add_circle
                  </span>
                </Box>
              </Box>
            ))
          ) : (
            <Box
              sx={{
                color: 'gray',
                fontWeight: 'bold',
                backgroundColor: 'white',
                padding: '50px',
                borderRadius: '20px',
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                width: "95%",
                fontSize: '2rem',
                textAlign: 'center',
              }}
            >
              No saved meals yet.
            </Box>
          )}
          <Modal open={isModalOpen} onClose={handleCloseModal}>
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '20px',
              width: '400px',
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Specify Plan Details</Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={dayOfWeek}
                  label="Day of Week"
                  onChange={(e) => setDayOfWeek(e.target.value)}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Meal Plan Type</InputLabel>
                <Select
                  value={mealPlanType}
                  label="Meal Plan Type"
                  onChange={(e) => setMealPlanType(e.target.value)}
                >
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((mealType) => (
                    <MenuItem key={mealType} value={mealType}>{mealType}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button className="primary-button" onClick={handleCloseModal}>Cancel</Button>
                <Button className="primary-button" onClick={handleAddMealItemToPlan}>Add Meal</Button>
              </Box>
            </Box>
          </Modal>
        </Box>
      )}
    </Box>
  );
}

export default LogFood;
