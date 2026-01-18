-- Users Table
CREATE TABLE users ( 
    id VARCHAR(50) PRIMARY KEY, 
    email VARCHAR(50) NOT NULL, 
    username VARCHAR(50) NOT NULL,
    password VARCHAR(25) NOT NULL,
    current_weight INTEGER,
    goal_weight INTEGER,
    height INTEGER,
    age INTEGER,
    gender VARCHAR(10),
    activity_level VARCHAR(25),
    target_calories INTEGER,
    target_protein INTEGER,
    target_fat INTEGER,
    target_carbs INTEGER
);

-- DailyFood Table
CREATE TABLE daily_food ( 
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    user_id VARCHAR(50) NOT NULL,
    meal_type VARCHAR(50) NOT NULL,
    name VARCHAR(50) NOT NULL,
    quantity VARCHAR(50) NOT NULL,
    calories INTEGER NOT NULL,
    carbs INTEGER NOT NULL,
    fat INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    sodium INTEGER NOT NULL,
    sugar INTEGER NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Meals Table
CREATE TABLE meals ( 
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name VARCHAR(50) NOT NULL,
    date TEXT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Meal Items Join Table (for list of food IDs in a meal)
CREATE TABLE meal_items (
    meal_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    PRIMARY KEY (meal_id, food_id),
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES daily_food(id) ON DELETE CASCADE
);

-- User Weight History Table
CREATE TABLE user_weight_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(50) NOT NULL,
    date_recorded DATETIME NOT NULL,
    weight INTEGER NOT NULL,
    -- Optionally track body fat %, waist size, etc. if needed
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
);