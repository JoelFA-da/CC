require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/login.html'));
});

// Serve signup page
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/signup.html'));
});

// Serve main app page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});





// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../Frontend')));

// Calorie calculation formulas
const calculateBMR = (gender, weight, height, age) => {
  // Mifflin-St Jeor Equation
  if (gender.toLowerCase() === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

const calculateTDEE = (bmr, activityLevel) => {
  const multipliers = {
    sedentary: 1.3,
    light: 1.4,
    moderate: 1.6,
    active: 1.8,
    extreme: 2.0
  };
  return bmr * multipliers[activityLevel];
};

// Calculate endpoint
app.post('/calculate', (req, res) => {
  try {
    // Parse and validate input
    const { gender, weight, height, age, activityLevel, goal, bodyFat } = req.body;

    if (!gender || !weight || !height || !age || !activityLevel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const ageNum = parseInt(age);
    const bodyFatNum = bodyFat ? parseFloat(bodyFat) : null;

    // Enhanced calculation with body fat
    let bmr, leanMass;
    if (bodyFatNum) {
      // Katch-McArdle Formula (more accurate with body fat)
      leanMass = weightNum * (1 - bodyFatNum / 100);
      bmr = 370 + (21.6 * leanMass);
    } else {
      // Mifflin-St Jeor (default)
      bmr = calculateBMR(gender, weightNum, heightNum, ageNum);
    }

    const tdee = calculateTDEE(bmr, activityLevel);

    let targetCalories;
    switch (goal) {
      case 'lose':
        if (bodyFatNum) {
          if (bodyFatNum > 25) {
            targetCalories = tdee - (tdee * 0.25); 
            break;
          } else if (bodyFatNum > 15 && bodyFatNum <= 25) {
            targetCalories = tdee - (tdee * 0.20); 
            break;
          } else if (bodyFatNum <= 15) {
            targetCalories = tdee - (tdee * 0.15); 
            break;
          }else{
            targetCalories = tdee - 500; // Default 500 cal deficit for general weight loss
          }
        }
      case 'gain': targetCalories = tdee + 500; break;
      default: targetCalories = tdee;
    }

    // Prepare response
    const response = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      bodyFat: bodyFatNum,
      leanMass: leanMass ? parseFloat(leanMass.toFixed(1)) : null,
      message: 'Calculation successful'
    };

    res.json(response);

  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Server error during calculation' });
  }
});
app.post('/calculatemacros', (req, res) => {
  try {
    const { goal, targetCalories, bodyFat, weight, activityLevel } = req.body;

    if (!goal || !targetCalories) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Default ratios based on goal
    let proteinRatio, carbRatio, fatRatio;

    switch (goal) {
      case 'lose':
        proteinRatio = 0.35;  // 35%
        carbRatio = 0.40;     // 40%
        fatRatio = 0.25;      // 25%
        break;
      case 'gain':
        proteinRatio = 0.30;  // 30%
        carbRatio = 0.50;     // 50%
        fatRatio = 0.20;      // 20%
        break;
      default: // maintain
        proteinRatio = 0.25;  // 25%
        carbRatio = 0.45;     // 45%
        fatRatio = 0.30;      // 30%
    }

    // Calculate grams (protein/carbs = 4 cal/g, fat = 9 cal/g)
    const macros = {
      protein: Math.round((targetCalories * proteinRatio) / 4),
      carbs: Math.round((targetCalories * carbRatio) / 4),
      fat: Math.round((targetCalories * fatRatio) / 9)
    };

    res.json({
      ...macros,
      message: 'Macro calculation successful'
    });

  } catch (error) {
    res.status(500).json({ error: 'Macro calculation failed' });
  }
});



// Handle 404 errors
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../Frontend/404.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const frontendPath = path.resolve(__dirname, '../Frontend');
app.get('/login', (req, res) => {
  const filePath = path.join(frontendPath, 'login.html');
  if (filePath.startsWith(frontendPath)) {
    res.sendFile(filePath);
  } else {
    res.status(403).send('Access denied');
  }
});
