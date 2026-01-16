import React from "react";
import { Dialog, DialogActions, DialogContent, Button } from "@mui/material";
import { z } from "zod";
import "./PopUpNutrition.css";

const NutrientSchema = z.object({
  calcium: z.coerce.number().optional(),
  calories: z.coerce.number(),
  carbohydrate: z.coerce.number(),
  cholesterol: z.coerce.number(),
  fat: z.coerce.number(),
  fiber: z.coerce.number().optional(),
  iron: z.coerce.number().optional(),
  monounsaturated_fat: z.coerce.number().optional(),
  polyunsaturated_fat: z.coerce.number().optional(),
  potassium: z.coerce.number().optional(),
  protein: z.coerce.number(),
  saturated_fat: z.coerce.number(),
  sodium: z.coerce.number(),
  sugar: z.coerce.number(),
  vitamin_a: z.coerce.number().optional(),
  vitamin_c: z.coerce.number().optional(),
  measurement_description: z.string(),
  metric_serving_amount: z.coerce.number(),
  metric_serving_unit: z.string(),
  serving_description: z.string(),
  serving_id: z.string(),
  serving_url: z.string().url(),
});

type NutrientData = z.infer<typeof NutrientSchema>;

interface PopupNutritionProps {
  open: boolean;
  onClose: () => void;
  nutritionData: NutrientData | null;
}

const PopupNutrition: React.FC<PopupNutritionProps> = ({ open, onClose, nutritionData }) => {
  if (nutritionData) {
    try {
      NutrientSchema.parse(nutritionData);
    } catch (e) {
      console.error("Invalid nutrition data", e);
      return null;
    }
  }

  const calculateDV = (value: number | undefined, standard: number) => {
    if (!value) return 0;
    return Math.round((value / standard) * 100);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{ "& .MuiPaper-root": { borderRadius: "20px" } }}
    >
      <DialogContent>
        {nutritionData ? (
          <div className="nutrition-label">
            <header className="label-header">
              <h1 className="label-title">Nutrition Facts</h1>
            </header>
            <div className="serving-info">
              <div>Serving Size {nutritionData.serving_description} ({Math.round(nutritionData.metric_serving_amount)}{nutritionData.metric_serving_unit})</div>
            </div>
            <div className="calories-section">
              <div className="calories-title">
                Amount Per Serving
                <span>Calories</span>
              </div>
              <div className="calories-value">{Math.trunc(nutritionData.calories)}</div>
            </div>

            <div className="daily-value-header">
              % Daily Value*
            </div>

            <div className="nutrient-row">
              <div>
                <span className="nutrient-name">Total Fat</span> {Math.round(nutritionData.fat)}g
              </div>
              <div className="dv-val">{calculateDV(nutritionData.fat, 78)}%</div>
            </div>

            <div className="nutrient-row indent">
              <div>
                <span className="nutrient-name normal-weight">Saturated Fat</span> {Math.round(nutritionData.saturated_fat)}g
              </div>
              <div className="dv-val">{calculateDV(nutritionData.saturated_fat, 20)}%</div>
            </div>

            {nutritionData.polyunsaturated_fat !== undefined && (
              <div className="nutrient-row indent">
                <div>
                  <span className="nutrient-name normal-weight">Polyunsaturated Fat</span> {Math.round(nutritionData.polyunsaturated_fat)}g
                </div>
              </div>
            )}
            {nutritionData.monounsaturated_fat !== undefined && (
              <div className="nutrient-row indent">
                <div>
                  <span className="nutrient-name normal-weight">Monounsaturated Fat</span> {Math.round(nutritionData.monounsaturated_fat)}g
                </div>
              </div>
            )}

            {/* Trans Fat is usually here but not in our data */}

            <div className="nutrient-row">
              <div>
                <span className="nutrient-name">Cholesterol</span> {Math.round(nutritionData.cholesterol)}mg
              </div>
              <div className="dv-val">{calculateDV(nutritionData.cholesterol, 300)}%</div>
            </div>

            <div className="nutrient-row">
              <div>
                <span className="nutrient-name">Sodium</span> {Math.round(nutritionData.sodium)}mg
              </div>
              <div className="dv-val">{calculateDV(nutritionData.sodium, 2300)}%</div>
            </div>

            <div className="nutrient-row">
              <div>
                <span className="nutrient-name">Total Carbohydrate</span> {Math.round(nutritionData.carbohydrate)}g
              </div>
              <div className="dv-val">{calculateDV(nutritionData.carbohydrate, 275)}%</div>
            </div>

            <div className="nutrient-row indent">
              <div>
                <span className="nutrient-name normal-weight">Dietary Fiber</span> {Math.round(nutritionData.fiber || 0)}g
              </div>
              <div className="dv-val">{calculateDV(nutritionData.fiber, 28)}%</div>
            </div>

            <div className="nutrient-row indent">
              <div>
                <span className="nutrient-name normal-weight">Total Sugars</span> {Math.round(nutritionData.sugar)}g
              </div>
            </div>

            <div className="nutrient-row thick-border">
              <div>
                <span className="nutrient-name">Protein</span> {Math.round(nutritionData.protein)}g
              </div>
              <div className="dv-val">{calculateDV(nutritionData.protein, 50)}%</div>
            </div>

            {/* Vitamins & Minerals */}
            <div className="nutrient-row no-border">
              <div>Vitamin D 0mcg</div>
              <div className="dv-val">0%</div>  {/* Placeholder/Not in data */}
            </div>

            <div className="nutrient-row no-border">
              <div>Calcium {Math.round(nutritionData.calcium || 0)}mg</div>
              <div className="dv-val">{calculateDV(nutritionData.calcium, 1300)}%</div>
            </div>

            <div className="nutrient-row no-border">
              <div>Iron {Math.round(nutritionData.iron || 0)}mg</div>
              <div className="dv-val">{calculateDV(nutritionData.iron, 18)}%</div>
            </div>

            <div className="nutrient-row">
              <div>Potassium {Math.round(nutritionData.potassium || 0)}mg</div>
              <div className="dv-val">{calculateDV(nutritionData.potassium, 4700)}%</div>
            </div>

            {/* Extra data present in source but often not on main label, or added as footer notes */}
            {nutritionData.vitamin_a ? (
              <div className="nutrient-row no-border">
                <div>Vitamin A {Math.round(nutritionData.vitamin_a || 0)} IU</div>
              </div>
            ) : null}
            {nutritionData.vitamin_c ? (
              <div className="nutrient-row">
                <div>Vitamin C {Math.round(nutritionData.vitamin_c || 0)}mg</div>
              </div>
            ) : null}

            <div className="footnote">
              * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading nutrition information...</div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" sx={{ color: 'black' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PopupNutrition;
