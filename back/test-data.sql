-- Updated Users Table Insert Data
INSERT INTO users (id, email, username, password, current_weight, goal_weight, height, age, gender, activity_level) VALUES
('user1', 'alice@example.com', 'alice123', '$argon2id$v=19$m=65536,t=3,p=4$iXgrKMu5e9OLt3hbMh568A$fx1QqmmsKO8O124zzHB3/9ayTdvjnGffpN7NDp3UEEY', null, null, null, null, null, null),
('user2', 'bob@example.com', 'bob456', '$argon2id$v=19$m=65536,t=3,p=4$iXgrKMu5e9OLt3hbMh568A$fx1QqmmsKO8O124zzHB3/9ayTdvjnGffpN7NDp3UEEY', null, null, null, null, null, null);

-- Daily Food Insert Data
INSERT INTO daily_food (id, user_id, meal_type, name, quantity, calories, carbs, fat, protein, sodium, sugar, date) VALUES
(1, 'user1', 'dinner', 'Chicken Stir-fry with White rice', '1 serving', 507, 10, 14, 56, 1400, 3, '2025-03-08'),
(2, 'user1', 'lunch', 'Soup and sandwich meal', '1 meal', 567, 10, 14, 56, 1400, 3, '2025-03-08');

-- Meals Insert Data (updated with auto-incremented ID)
INSERT INTO meals (name, date, user_id) VALUES
('Chicken Stir-fry with White rice', '2025-02-18', 'user1'),
('Soup and sandwich meal', '2025-02-18', 'user1');

-- Meal Items Join Data (Updated meal_id with auto-incremented values)
INSERT INTO meal_items (meal_id, food_id) VALUES
(1, 1), -- Meal 1: Chicken Stir-fry with White rice
(2, 2); -- Meal 2: Soup and sandwich meal

-- Updated Meals Table Insert Data
INSERT INTO meals (name, date, user_id) VALUES
('Meal 1', '2025-03-07', 'user1'),
('Meal 2', '2025-03-07', 'user1'),
('Meal 3', '2025-03-07', 'user1'),
('Meal 4', '2025-03-07', 'user1'),
('Meal 5', '2025-03-07', 'user1'),
('Meal 6', '2025-03-07', 'user1'),
('Meal 7', '2025-03-07', 'user1'),
('Meal 8', '2025-03-07', 'user1'),
('Meal 9', '2025-03-07', 'user1'),
('Meal 10', '2025-03-07', 'user1'),
('Meal 11', '2025-03-07', 'user1'),
('Meal 12', '2025-03-07', 'user1'),
('Meal 13', '2025-03-07', 'user1'),
('Meal 14', '2025-03-07', 'user1'),
('Meal 15', '2025-03-07', 'user1'),
('Meal 16', '2025-03-07', 'user1'),
('Meal 17', '2025-03-07', 'user1'),
('Meal 18', '2025-03-07', 'user1'),
('Meal 19', '2025-03-07', 'user1'),
('Meal 20', '2025-03-07', 'user1');

-- Meal Items Join Data (updated with auto-incremented meal_id)
INSERT INTO meal_items (meal_id, food_id) VALUES
(1, 100),
(2, 101),
(3, 102),
(4, 103),
(5, 104),
(6, 105),
(7, 106),
(8, 107),
(9, 108),
(10, 109),
(11, 110),
(12, 111),
(13, 112),
(14, 113),
(15, 114),
(16, 115),
(17, 116),
(18, 117),
(19, 118),
(20, 119);

-- Goals test data
INSERT INTO user_weight_history (user_id, date_recorded, weight, notes) VALUES ('user1', '2025-01-01', 241, 'Steady weight loss');
INSERT INTO user_weight_history (user_id, date_recorded, weight, notes) VALUES ('user1', '2025-01-08', 233, 'Steady weight loss');
INSERT INTO user_weight_history (user_id, date_recorded, weight, notes) VALUES ('user1', '2025-01-15', 224, 'Steady weight loss');
INSERT INTO user_weight_history (user_id, date_recorded, weight, notes) VALUES ('user1', '2025-01-22', 217, 'Steady weight loss');
INSERT INTO user_weight_history (user_id, date_recorded, weight, notes) VALUES ('user1', '2025-01-29', 210, 'Steady weight loss');
INSERT INTO user_weight_history (user_id, date_recorded, weight, notes) VALUES ('user1', '2025-02-05', 203, 'Steady weight loss');
INSERT INTO user_weight_history (user_id, date_recorded, weight, notes) VALUES ('user1', '2025-02-12', 193, 'Steady weight loss');
INSERT INTO user_weight_history (user_id, date_recorded, weight, notes) VALUES ('user1', '2025-02-19', 183, 'Minor fluctuation');
INSERT INTO user_weight_history (user_id, date_recorded, weight, notes) VALUES ('user1', '2025-02-26', 175, 'Minor fluctuation');
INSERT INTO user_weight_history (user_id, date_recorded, weight, notes) VALUES ('user1', '2025-03-05', 167, 'Minor fluctuation');

