require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');


app.use('/Frontend', express.static(path.join(__dirname, '../Frontend')));

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
    const { gender, weight, height, age, activityLevel, goal, bodyFat, trainingDuration } = req.body;

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

    let targetCalories, surplus = 0.20; // Default surplus for weight gain
    let trainingStatus = "Unknown";

    if (goal == 'lose') {
      if (gender.toLowerCase() === 'male') {
        if (bodyFatNum) {
          if (bodyFatNum > 25) {
            targetCalories = tdee - (tdee * 0.25);
            
          } else if (bodyFatNum > 15 && bodyFatNum <= 25) {
            targetCalories = tdee - (tdee * 0.20);
           
          } else if (bodyFatNum <= 15) {
            targetCalories = tdee - (tdee * 0.15);
           
          }

        }
        else {
          targetCalories = tdee - 500; // Default 500 cal deficit for general weight loss
        }
      } else {
        if (bodyFatNum) {
          if (bodyFatNum > 30) {
            targetCalories = tdee - (tdee * 0.25);
            
          } else if (bodyFatNum > 22 && bodyFatNum <= 30) {
            targetCalories = tdee - (tdee * 0.20);
           
          } else if (bodyFatNum <= 22) {
            targetCalories = tdee - (tdee * 0.15);
           
          }
        } else {
          targetCalories = tdee - (tdee * 0.20); // Default 20% deficit for general weight loss
          console.log('No body fat provided, using default 20% deficit', targetCalories);

        }
      }
    }
    if (goal === 'gain') {
      if (gender === 'male') {
        if (bodyFatNum && bodyFatNum >= 25) {
          // High BF → minimal surplus -> 5% TDEE
          trainingStatus = "High Body Fat";
          targetCalories = tdee + tdee * 0.05;
          
        } else {
          switch (trainingDuration) {  // assuming this is the name from the frontend
            case '<6':
              trainingStatus = "Beginner";
              surplus = 0.20; // +20% TDEE
              break;
            case '6-24':
              trainingStatus = "Intermediate";
              surplus = 0.10; // +10% TDEE
              break;
            case '>24':
              trainingStatus = "Advanced";
              surplus = 0.05; // +5% TDEE
              break;
            default:
              trainingStatus = "Unknown";
              surplus = 0.10; // fallback to 10%
              break;
          }
          targetCalories = tdee + (tdee * surplus);
          console.log('Target calories for gain:', targetCalories);
        }
      } else {
        if (bodyFatNum && bodyFatNum >= 30) {
          // High BF → minimal surplus -> 5% TDEE
          trainingStatus = "High Body Fat";
          targetCalories = tdee + tdee * 0.05;
        } else {
          switch (trainingDuration) {  // assuming this is the name from the frontend
            case '<6':
              trainingStatus = "Beginner";
              surplus = 0.15; // +15% TDEE
              break;
            case '6-24':
              trainingStatus = "Intermediate";
              surplus = 0.08; // +8% TDEE
              break;
            case '>24':
              trainingStatus = "Advanced";
              surplus = 0.05; // +5% TDEE
              break;
            default:
              trainingStatus = "Unknown";
              surplus = 0.08; // fallback to 10%
              break;
          }
          targetCalories = tdee + (tdee * surplus);
        }
      }
    }
  

    if (goal === 'maintain') {
    targetCalories = tdee; // No change for maintenance
    trainingStatus = "Maintenance";
  }
  console.log({
    targetCalories,
    trainingDuration,
    // goal,
    //  trainingStatus,
    gender,
  })
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
  console.log('Route /calculatemacros was called');  // Add this line
  try {
    const { goal, targetCalories, bodyFat, weight, gender } = req.body;

    if (!goal || !targetCalories) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Define macro ratios based on body fat percentage and goal
    let protein, fat, carbs, leanMass;
    let calProte, calFat;
    let proteinGrams, fatGrams, remainingCalories, carbGrams;

    leanMass = parseFloat(weight) * (1 - (bodyFat ? parseFloat(bodyFat) / 100 : 0)); // Calculate lean mass in kg
    if (gender === 'male') {
      if (bodyFat) {
        const bodyFatNum = parseFloat(bodyFat);
        if (bodyFatNum > 25) {
          protein = 2.4;
          fat = 1.1;
        } else if (bodyFatNum >= 15 && bodyFatNum <= 25) {
          protein = 2.6;
          fat = 1.2;
        } else {
          protein = 2.0;
          fat = 0.8;
        }
      } else {
        // Default macro ratios if body fat is not provided
        protein = 2.0;
        fat = 0.8;
      }
    } else if (gender === 'female') {
      if (bodyFat) {
        const bodyFatNum = parseFloat(bodyFat);
        if (bodyFatNum > 30) {
          protein = 2.2;
          fat = 1.2;
        } else if (bodyFatNum >= 22 && bodyFatNum <= 30) {
          protein = 2.4;
          fat = 1.3;
        } else {
          protein = 2.6;
          fat = 1.3;
        }
      } else {
        // Default macro ratios if body fat is not provided
        protein = 1.8;
        fat = 0.9;
      }
    }

    // Calculate grams based on lean mass
    proteinGrams = Math.round(protein * leanMass);
    fatGrams = Math.round(fat * leanMass);
    remainingCalories = targetCalories - (proteinGrams * 4 + fatGrams * 9);
    carbGrams = Math.round(remainingCalories / 4);

    // Calculate calories from macros
    calProte = proteinGrams * 4;
    calFat = fatGrams * 9;
    // Log the calculated values for debugging
    console.log({
      gender,
      goal,
      targetCalories,
      bodyFat,

      /*
      activityLevel, 
      proteinGrams,
      fat,
      fatGrams,
      remainingCalories,
      carbGrams,
      bodyFat, weight, calProte, calFat, 
     */
    });

    // Prepare response
    res.json({
      protein: proteinGrams,
      fat: fatGrams,
      carbs: carbGrams,
      message: 'Macro calculation successful'
    });

  } catch (error) {
    console.error('Macro calculation error:', error);
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
