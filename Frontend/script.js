// Placeholder for auth buttons
document.getElementById('loginBtn').addEventListener('click', () => {
    window.location.href = '/Frontend/login.html'; // Or whatever your login route will be
});
document.getElementById('signupBtn').addEventListener('click', () => {
    window.location.href = '/Frontend/signup.html'; // Or whatever your signup route will be
});

// Calculate lean mass when body fat changes

document.getElementById('bodyFat').addEventListener('input', function () {
    const bodyFatInput = parseFloat(this.value);
    const weightInput = parseFloat(document.getElementById('weight').value);
    const leanMassField = document.getElementById('leanMass');
    if (!isNaN(bodyFatInput) && !isNaN(weightInput)) {
        const leanMass = weightInput * (1 - bodyFatInput / 100);
        leanMassField.value = leanMass.toFixed(1);
    } else {
        leanMassField.value = ''; // Clear if invalid or empty
    }
});
// Main calculator functionality
document.getElementById('calorieForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Get form data
    const formData = {
        gender: document.getElementById('gender').value,
        age: document.getElementById('age').value,
        weight: document.getElementById('weight').value,
        height: document.getElementById('height').value,
        activityLevel: document.getElementById('activityLevel').value,
        goal: document.getElementById('goal').value,
        bodyFat: document.getElementById('bodyFat').value || null,
        trainingDuration: document.getElementById('trainingDuration').value,
    };

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="inline-block animate-spin">↻</span> Calculating...`;

        // Send request to server
        //const response = await fetch('http://localhost:3000/calculate', {
             const response = await fetch('/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });


        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Calculation failed');
        }

        // Display results
        displayResults(data, formData.goal);

    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Calculate My Calories';
    }
});

async function displayResults(data, goal) {
    const resultElement = document.getElementById('results');

    // Remove previous composition chart if it exists
    const existingChart = document.getElementById('compositionChart');
    if (existingChart) {
        existingChart.remove();
    }

    // Update text values
    document.getElementById('bmrValue').textContent = Math.round(data.bmr);
    document.getElementById('tdeeValue').textContent = Math.round(data.tdee);
    document.getElementById('targetValue').textContent = Math.round(data.targetCalories);

    // Update lean mass field if available
    if (data.leanMass) {
        document.getElementById('leanMass').value = parseFloat(data.leanMass).toFixed(1);
    }

    // Add body composition visualization if body fat is provided
    if (data.bodyFat !== null) {
        const total = 100;
        const bodyFat = parseFloat(data.bodyFat);
        const leanMass = total - bodyFat;
        const weight = parseFloat(document.getElementById('weight').value);

        const chartHTML = `
    <div class="mt-8" id="compositionChart">
      <h3 class="text-xl font-bold text-gray-800 mb-4">Composición corporal
</h3>
      <div class="flex items-center justify-center h-64">
        <svg viewBox="0 0 36 36" class="w-64 h-64 -rotate-90">
          <!-- Background Circle -->
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="#E5E7EB"
            stroke-width="4"
          />

          <!-- Body Fat Arc -->
          <circle
            id="fatArc"
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="#F87171"
            stroke-width="4"
            stroke-dasharray="${bodyFat} ${total - bodyFat}"
            stroke-dashoffset="0"
            stroke-linecap="round"
            style="cursor: pointer"
          />

          <!-- Lean Mass Arc -->
          <circle
            id="leanArc"
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="#60A5FA"
            stroke-width="4"
            stroke-dasharray="${leanMass} ${bodyFat}"
            stroke-dashoffset="${-bodyFat}"
            stroke-linecap="round"
            style="cursor: pointer"
          />

          <!-- Center Text Group -->
          <g transform="rotate(90, 18, 18)">
            <text id="centerValue" x="18" y="16" text-anchor="middle" fill="#1E3A8A" font-size="3.5" font-weight="bold">
              ${bodyFat.toFixed(1)}%
            </text>
            <text id="centerLabel" x="18" y="21" text-anchor="middle" fill="#6B7280" font-size="2.5">
              Masa grasa
            </text>
          </g>
        </svg>
      </div>

      <div class="flex justify-center space-x-8 mt-4">
        <div class="text-center">
          <p class="text-sm text-gray-500">Masa grasa</p>
          <p class="font-bold">${(weight * (bodyFat / 100)).toFixed(1)} kg</p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500">Masa magra</p>
          <p class="font-bold">${(weight * (leanMass / 100)).toFixed(1)} kg</p>
        </div>
      </div>
    </div>
  `;

        resultElement.insertAdjacentHTML('beforeend', chartHTML);

        // 🧠 Add interactivity
        document.getElementById("fatArc").addEventListener("click", () => {
            document.getElementById("centerValue").textContent = `${bodyFat.toFixed(1)}%`;
            document.getElementById("centerLabel").textContent = "Masa grasa";
        });

        document.getElementById("leanArc").addEventListener("click", () => {
            document.getElementById("centerValue").textContent = `${leanMass.toFixed(1)}%`;
            document.getElementById("centerLabel").textContent = "Masa magra";
        });
    }



    // Update macro calculator
    try {
        // Get macros
       // const macroResponse = await fetch('http://localhost:3000/calculatemacros', {
             const macroResponse = await fetch('/calculatemacros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                goal: goal,
                targetCalories: data.targetCalories,
                weight: document.getElementById('weight').value,
                gender: document.getElementById('gender').value,
                bodyFat: document.getElementById('bodyFat').value || null
            })
        });

        const macros = await macroResponse.json();

        if (macroResponse.ok) {
            // Update macro displays
            document.getElementById('proteinValue').textContent = macros.protein + ' g';
            document.getElementById('carbsValue').textContent = macros.carbs + ' g';
            document.getElementById('fatsValue').textContent = macros.fat + ' g';

            // Update goal text
            const goalText = {
                'lose': 'déficit calórico',
                'gain': 'superávit calórico',
                'maintain': 'balance calórico'
            }[goal];
            document.getElementById('macroGoalText').textContent = goalText;
        }
    } catch (error) {
        console.error('Macro calculation error:', error);
    }


    // Update goal text
    let goalText = '';
    switch (goal) {
        case 'lose': goalText = 'Para perder 0.5kg por semana'; break;
        case 'gain': goalText = 'Para ganar 0.5kg por semana'; break;
        default: goalText = 'Para mantener tu peso actual'; break;
    }
    document.getElementById('goalText').textContent = goalText;

    // Animation for chart bars
    const maxValue = Math.max(data.bmr, data.tdee, data.targetCalories);
    document.getElementById('bmrBar').style.height = `${(data.bmr / maxValue) * 100}%`;
    document.getElementById('tdeeBar').style.height = `${(data.tdee / maxValue) * 100}%`;
    document.getElementById('targetBar').style.height = `${(data.targetCalories / maxValue) * 100}%`;

    // Show results with animation
    resultElement.classList.remove('hidden');
    resultElement.classList.add('animate__fadeInUp');
    /*
        // Dark Mode Toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        const darkModeIcon = document.getElementById('darkModeIcon');
        const htmlElement = document.documentElement;
    
    
    
        // Check for saved preference or system preference
       if (localStorage.getItem('darkMode') === 'enabled' || 
           (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
           enableDarkMode();
       }
    
        // Toggle dark mode
        darkModeToggle.addEventListener('click', () => {
            if (htmlElement.classList.contains('dark')) {
                disableDarkMode();
            } else {
                enableDarkMode();
            }
        });
        function enableDarkMode() {
            htmlElement.classList.add('dark');
            darkModeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('darkMode', 'enabled');
        }
        function disableDarkMode() {
           htmlElement.classList.remove('dark');
           darkModeIcon.classList.replace('fa-sun', 'fa-moon');
           localStorage.setItem('darkMode', 'disabled');
       }
    
        // Scroll to results
        resultElement.scrollIntoView({ behavior: 'smooth' });
    */
}
