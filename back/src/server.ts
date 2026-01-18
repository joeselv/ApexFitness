import express, { Response, Request, CookieOptions } from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as url from 'url';
import {
  DBDailyFoodItem,
  UIDailyMeal,
  User,
} from '@apex/shared';
import * as crypto from 'crypto';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import argon2 from 'argon2';
import * as dotenv from 'dotenv';
import path from 'path';

const __filename = url.fileURLToPath(import.meta.url);
const __curr_dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__curr_dirname, '../../.env') });

if (!process.env.FATSECRET_CLIENT_SECRET || !process.env.FATSECRET_CLIENT_ID) {
  throw new Error(
    'FATSECRET_CLIENT_ID and/or FATSECRET_CLIENT_SECRET is not defined in .env file'
  );
}

if (!process.env.BURN_API_KEY) {
  throw new Error('BURN_API_KEY is not defined in .env file');
}
const BURN_API_URL = 'https://api.api-ninjas.com/v1/caloriesburned';

let app = express();
app.use(express.json());

const __dirname = url.fileURLToPath(new URL('..', import.meta.url));
const dbfile = `${__dirname}database.db`;
const db = await open({
  filename: dbfile,
  driver: sqlite3.Database,
});
await db.get('PRAGMA foreign_keys = ON');

let reactAssetsPath = path.join(__dirname, "../front/dist");
app.use(express.static(reactAssetsPath));

const tokenStorage: { [key: string]: string } = {};
function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function validateLogin(body: { email: string; password?: string }) {
  return body.email && body.password !== undefined;
}

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};

app.use(cookieParser());

async function getUserIdFromCookies(
  token: string | undefined
): Promise<string | null> {
  // ! NEED TO AWAIT WHEN CALLING THIS (returns a promise)
  if (!token) {
    console.log('No token provided');
    return null;
  }

  // Look up the email from tokenStorage
  const email = tokenStorage[token];
  if (!email) {
    console.log('Invalid or expired token');
    return null;
  }

  // Query the users table for the user ID
  try {
    const user = await db.get('SELECT id FROM users WHERE email = ?', [email]);

    if (user) {
      return user.id;
    } else {
      console.log('User not found in the database');
      return null;
    }
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
}

// Auth
const FATSECRET_API_URL = 'https://platform.fatsecret.com/rest/server.api';
const FATSECRET_TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
let fatSecretAccessToken: string | null = null;
let tokenExpiryTime: number | null = null;

async function getFatSecretAccessToken() {
  if (fatSecretAccessToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
    return fatSecretAccessToken;
  }

  try {
    const response = await axios.post(
      FATSECRET_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'premier',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: process.env.FATSECRET_CLIENT_ID!,
          password: process.env.FATSECRET_CLIENT_SECRET!,
        },
      }
    );

    fatSecretAccessToken = response.data.access_token;
    tokenExpiryTime = Date.now() + response.data.expires_in * 1000;
    return fatSecretAccessToken;
  } catch (error) {
    console.error('Error fetching FatSecret access token:', error);
    throw new Error('Failed to obtain FatSecret access token');
  }
}

// Middleware to ensure we have a valid FatSecret token before making API calls
async function authenticateFatSecret(req: Request, res: Response, next: any) {
  try {
    const accessToken = await getFatSecretAccessToken();
    if (accessToken) {
      req.accessToken = accessToken;
      next();
    } else {
      res
        .status(500)
        .json({ error: 'Failed to obtain FatSecret access token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication with FatSecret failed' });
  }
}

app.post('/api/register', async (req, res) => {
  const { email, username, password } = req.body;

  if (!validateLogin(req.body)) {
    console.log('Invalid input:', req.body);
    return res
      .status(400)
      .json({ error: 'Email, Username, and Password are required' });
  }

  // Parameterized query to prevent SQL injection
  const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [
    email,
  ]);
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // Generate a unique user ID (UUID)
  const uid = crypto.randomUUID(); // Example: "550e8400-e29b-41d4-a716-446655440000"

  // Hash the user password
  let hash: string;
  try {
    hash = await argon2.hash(password);
  } catch (error) {
    console.log('Hashing failed', error);
    return res.sendStatus(500);
  }

  // Insert the new user into the database
  try {
    const statement = await db.prepare(
      'INSERT INTO users (id, email, username, password, current_weight, goal_weight, height, age, activity_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    await statement.run(
      uid,
      email,
      username,
      hash,
      null,
      null,
      null,
      null,
      null
    );

    console.log('Inserted user:', uid);
  } catch (error) {
    console.log('Insert error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }

  const token = makeToken();
  tokenStorage[token] = email;

  return res
    .cookie('token', token, cookieOptions)
    .json({ message: 'Signup successful', user_id: uid });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!validateLogin(req.body)) {
    return res.sendStatus(400);
  }

  let result;
  try {
    result = await db.get('SELECT id, password FROM users WHERE email = ?', [
      email,
    ]);
  } catch (error) {
    console.error('Select failed', error);
    return res.sendStatus(500);
  }

  if (!result) {
    return res.sendStatus(404);
  }

  const hash = result.password;

  let verifyResult;
  try {
    verifyResult = await argon2.verify(hash, password);
  } catch (error) {
    console.error('Verification failed', error);
    return res.sendStatus(500);
  }

  if (!verifyResult) {
    return res.sendStatus(400);
  }

  const token = makeToken();
  tokenStorage[token] = email;
  res.cookie('token', token, cookieOptions);

  return res.json({
    message: 'Login successful',
    user: { email: email, id: result.id },
  });
});

app.post('/api/logout', (req, res) => {
  const { token } = req.cookies;
  if (!token || !tokenStorage[token]) {
    return res.sendStatus(400); // Already logged out or invalid token
  }
  delete tokenStorage[token];
  return res
    .clearCookie('token', cookieOptions)
    .json({ message: 'Logout successful' });
});

app.put('/api/user', async (req: { body: User }, res) => {
  const {
    id, // Now a UUID instead of an integer
    email,
    username,
    password,
    current_weight,
    goal_weight,
    height,
    age,
    activity_level,
  } = req.body;

  const validateRequest = () => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return 'ID, Email, Username, and Password are required';
    }
    if (!id) return 'User ID required';
    if (!email) return 'Email required';
    if (!username) return 'Username required';
    if (!password) return 'Password required';
    return null;
  };

  const validationError = validateRequest();
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    // Check if user exists
    const existingUser = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: `No user found with ID ${id}` });
    }

    // Prepare the update query
    const statement = await db.prepare(
      `UPDATE users 
       SET email = ?, username = ?, password = ?, current_weight = ?, goal_weight = ?, height = ?, age = ?, activity_level = ? 
       WHERE id = ?`
    );

    await statement.run(
      email,
      username,
      password,
      current_weight,
      goal_weight,
      height,
      age,
      activity_level,
      id
    );

    return res
      .status(200)
      .json({ message: `User ${id} updated successfully!` });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/auth/check', (req, res) => {
  const { token } = req.cookies; // Get the token from cookies

  if (!token || !tokenStorage[token]) {
    return res
      .status(401)
      .json({ loggedIn: false, error: 'Not authenticated' });
  }

  return res.json({ loggedIn: true });
});

// Replace previous API calls with OAuth2 authorization header
app.get(
  '/api/search-food',
  authenticateFatSecret,
  async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;

      const params = {
        method: 'foods.search',
        search_expression: query,
        format: 'json',
        max_results: 10,
        include_food_attributes: 1,
        flag_default_serving: 1,
      };

      const response = await axios.get(FATSECRET_API_URL, {
        headers: {
          Authorization: `Bearer ${req.accessToken}`,
        },
        params: params,
      });

      res.json(response.data);
    } catch (error) {
      console.error('Error fetching food data:', error);
      res.status(500).json({ error: 'Failed to fetch food data' });
    }
  }
);

app.get(
  '/api/food-detail',
  authenticateFatSecret,
  async (req: Request, res: Response) => {
    try {
      const foodId = req.query.foodId as string;

      const params = {
        method: 'food.get.v2',
        food_id: foodId,
        format: 'json',
      };

      const response = await axios.get(FATSECRET_API_URL, {
        headers: {
          Authorization: `Bearer ${req.accessToken}`,
        },
        params: params,
      });

      res.json(response.data);
    } catch (error) {
      console.error('Error fetching food detail:', error);
      res.status(500).json({ error: 'Failed to fetch food details' });
    }
  }
);

app.get('/api/user', async (req: Request, res: Response) => {
  // Retrieve token from cookies
  const { token } = req.cookies;
  if (!token || !tokenStorage[token]) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Look up the user's email based on the token
  const userEmail = tokenStorage[token];

  try {
    // Query the database for the user by email
    const user = await db.get('SELECT * FROM users WHERE email = ?', [
      userEmail,
    ]);
    if (!user) {
      return res
        .status(404)
        .json({ error: `No user found with email ${userEmail}` });
    }
    // Return the user object (all fields)
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH endpoint for updating body metrics
app.patch('/api/user/metrics', async (req: Request, res: Response) => {
  // Retrieve token from cookies (using token-based authentication)
  const { token } = req.cookies;
  if (!token || !tokenStorage[token]) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Retrieve the user's email from tokenStorage
  const userEmail = tokenStorage[token];

  try {
    // Get the existing user record by email
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [
      userEmail,
    ]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract only the body metrics from the request body
    const { current_weight, goal_weight, height, age, gender, activity_level, target_calories, target_protein, target_fat, target_carbs } =
      req.body;

    // Update the user record with new metrics, preserving fields that are not provided
    await db.run(
      `UPDATE users 
       SET 
         current_weight = COALESCE(?, current_weight),
         goal_weight = COALESCE(?, goal_weight),
         height = COALESCE(?, height),
         age = COALESCE(?, age),
         gender = COALESCE(?, gender),
         activity_level = COALESCE(?, activity_level),
         target_calories = COALESCE(?, target_calories),
         target_protein = COALESCE(?, target_protein),
         target_fat = COALESCE(?, target_fat),
         target_carbs = COALESCE(?, target_carbs)
       WHERE email = ?`,
      current_weight,
      goal_weight,
      height,
      age,
      gender,
      activity_level,
      target_calories,
      target_protein,
      target_fat,
      target_carbs,
      userEmail
    );

    // If a new current weight is provided, log it in the history table (limit to one entry per day)
    if (current_weight !== undefined && current_weight !== null) {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toLocaleDateString('en-CA');

      // Check if there's already an entry for today for this user
      const existingEntry = await db.get(
        `SELECT * FROM user_weight_history 
         WHERE user_id = ? AND date(date_recorded) = ?`,
        [existingUser.id, today]
      );

      if (existingEntry) {
        // Update the existing entry's weight
        await db.run(
          `UPDATE user_weight_history 
           SET weight = ? 
           WHERE id = ?`,
          current_weight,
          existingEntry.id
        );
      } else {
        // Insert a new entry if none exists for today
        const date_recorded = new Date().toISOString();
        await db.run(
          `INSERT INTO user_weight_history (user_id, date_recorded, weight)
           VALUES (?, ?, ?)`,
          existingUser.id,
          date_recorded,
          current_weight
        );
      }
    }

    // Retrieve and return the updated user record
    const updatedUser = await db.get('SELECT * FROM users WHERE email = ?', [
      userEmail,
    ]);
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating metrics:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

//WEIGHT HISTORY FOR PROGRESS
// GET endpoint for retrieving user weight history
app.get('/api/weight_history', async (req: Request, res: Response) => {
  // Retrieve token from cookies (using token-based authentication)
  const { token } = req.cookies;
  if (!token || !tokenStorage[token]) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Retrieve the user's email from tokenStorage
  const userEmail = tokenStorage[token];

  try {
    // Get the user record by email to retrieve their user_id
    const user = await db.get('SELECT * FROM users WHERE email = ?', [
      userEmail,
    ]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract optional date range query parameters
    const { start_date, end_date } = req.query;

    // Build the SQL query to fetch weight history
    let query = `
      SELECT date_recorded, weight 
      FROM user_weight_history 
      WHERE user_id = ?
    `;
    const queryParams: any[] = [user.id];

    // Add date range filters if provided
    if (start_date || end_date) {
      const conditions: string[] = [];
      if (start_date) {
        conditions.push('date(date_recorded) >= ?');
        queryParams.push(start_date);
      }
      if (end_date) {
        conditions.push('date(date_recorded) <= ?');
        queryParams.push(end_date);
      }
      query += ` AND ${conditions.join(' AND ')}`;
    }

    // Order by date ascending
    query += ' ORDER BY date_recorded ASC';

    // Fetch weight history entries
    const weightHistory = await db.all(query, queryParams);

    // Format the response
    const formattedHistory = weightHistory.map((entry: any) => ({
      date: entry.date_recorded, // ISO format (e.g., "2024-03-13T12:00:00.000Z")
      weight: entry.weight,
    }));

    return res.status(200).json(formattedHistory);
  } catch (error) {
    console.error('Error fetching weight history:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/daily_food', async (req: Request, res: Response) => {
  const user_id = await getUserIdFromCookies(req.cookies.token);
  const { date, meal_type } = req.query;

  if (!user_id || !date || !meal_type) {
    return res
      .status(400)
      .json({ error: 'Date, and meal type are required inputs' });
  }

  try {
    const query = `
      SELECT * FROM daily_food 
      WHERE user_id = ? AND date = ? AND meal_type = ?
    `;
    const result = await db.all(query, [user_id, date, meal_type]);

    if (result.length === 0) {
      return res.json({ result: [] });
    }

    return res.json({ result });
  } catch (error) {
    console.error('Error fetching daily food entries:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/daily_food', async (req: Request, res: Response) => {
  const user_id = await getUserIdFromCookies(req.cookies.token);
  const {
    meal_type,
    name,
    quantity,
    calories,
    carbs,
    fat,
    protein,
    sodium,
    sugar,
    date,
  } = req.body;

  if (
    meal_type == null ||
    name == null ||
    calories == null ||
    carbs == null ||
    fat == null ||
    protein == null ||
    quantity == null
  ) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const statement = await db.prepare(
      'INSERT INTO daily_food (user_id, meal_type, name, quantity, calories, carbs, fat, protein, sodium, sugar, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = await statement.run(
      user_id,
      meal_type,
      name,
      quantity,
      calories,
      carbs,
      fat,
      protein,
      sodium,
      sugar,
      date
    );

    return res.status(201).json({
      message: 'Daily food item added successfully',
      id: result.lastID,
    });
  } catch (error) {
    console.error('Error inserting daily food item:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/daily_food/:id', async (req: Request, res: Response) => {
  const user_id = await getUserIdFromCookies(req.cookies.token);
  const dailyFoodId = parseInt(req.params.id, 10);

  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (isNaN(dailyFoodId)) {
    return res.status(400).json({ error: 'Invalid Daily Food ID' });
  }

  try {
    const foodItem = await db.get(
      'SELECT * FROM daily_food WHERE id = ? AND user_id = ?',
      [dailyFoodId, user_id]
    );

    if (!foodItem) {
      return res
        .status(404)
        .json({ error: 'Daily food item not found or does not belong to the user' });
    }

    await db.run('DELETE FROM daily_food WHERE id = ?', [dailyFoodId]);

    return res.status(200).json({ message: 'Daily food item deleted successfully' });
  } catch (error) {
    console.error('Error deleting daily food item:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/daily_food/:id', async (req: Request, res: Response) => {
  const user_id = await getUserIdFromCookies(req.cookies.token);
  const dailyFoodId = parseInt(req.params.id, 10);

  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (isNaN(dailyFoodId)) {
    return res.status(400).json({ error: 'Invalid Daily Food ID' });
  }

  try {
    const query = `
      SELECT * FROM daily_food 
      WHERE user_id = ? AND id = ?
    `;
    const result = await db.get(query, [user_id, dailyFoodId]);

    if (!result) {
      return res.status(404).json({ error: 'Daily food item not found' });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error fetching daily food item:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/meals', async (req: Request, res: Response) => {
  const user_id = await getUserIdFromCookies(req.cookies.token);

  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const mealsQuery = `
      SELECT m.id AS meal_id, m.name AS meal_name, m.date AS meal_date
      FROM meals m
      WHERE m.user_id = ?
    `;
    const meals = await db.all(mealsQuery, [user_id]);

    if (meals.length === 0) {
      return res.json({ meals: [] });
    }

    const mealsWithItems = await Promise.all(
      meals.map(async (meal) => {
        const mealItemsQuery = `
          SELECT df.id AS food_id, df.name AS food_name, df.calories, df.carbs, df.fat, df.protein, df.sodium, df.sugar, df.date, df.quantity
          FROM daily_food df
          INNER JOIN meal_items mi ON df.id = mi.food_id
          WHERE mi.meal_id = ?
        `;
        const foodItems = await db.all(mealItemsQuery, [meal.meal_id]);

        const transformedFoodItems = foodItems.map((foodItem) => ({
          id: foodItem.food_id,
          name: foodItem.food_name,
          quantity: foodItem.quantity,
          calories: foodItem.calories,
          carbs: foodItem.carbs,
          fat: foodItem.fat,
          protein: foodItem.protein,
          sodium: foodItem.sodium,
          sugar: foodItem.sugar,
          date: foodItem.date,
        }));

        return { ...meal, food_items: transformedFoodItems };
      })
    );

    return res.json({ meals: mealsWithItems });
  } catch (error) {
    console.error('Error fetching meals:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/meals/:meal_id', async (req, res) => {
  const user_id = await getUserIdFromCookies(req.cookies.token);
  const meal_id = parseInt(req.params.meal_id, 10);

  if (!user_id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (isNaN(meal_id)) {
    return res.status(400).json({ error: 'Invalid meal ID' });
  }

  try {
    const meal = await db.get(
      'SELECT * FROM meals WHERE id = ? AND user_id = ?',
      [meal_id, user_id]
    );

    if (!meal) {
      return res
        .status(404)
        .json({ error: 'Meal not found or does not belong to the user' });
    }

    await db.run('DELETE FROM meals WHERE id = ?', [meal_id]);

    return res.status(200).json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("*", (req, res) => {
  return res.sendFile("index.html", { root: reactAssetsPath });
});

// run server
let port = 3001;
let host = 'localhost';
let protocol = 'http';

app.listen(port, host, () => {
  console.log(`${protocol}://${host}:${port}`);
});
