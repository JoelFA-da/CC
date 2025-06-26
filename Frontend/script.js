// Placeholder for auth buttons
document.getElementById('loginBtn').addEventListener('click', () => {
    window.location.href = '/Frontend/login.html'; // Or whatever your login route will be
});
document.getElementById('signupBtn').addEventListener('click', () => {
    window.location.href = '/Frontend/signup.html'; // Or whatever your signup route will be
});

// Calculate lean mass when body fat changes

document.getElementById('bodyFat').addEventListener('input', function() {
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
document.getElementById('calorieForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Get form data
    const formData = {
        gender: document.getElementById('gender').value,
        age: document.getElementById('age').value,
        weight: document.getElementById('weight').value,
        height: document.getElementById('height').value,
        activityLevel: document.getElementById('activityLevel').value,
        goal: document.getElementById('goal').value,
        bodyFat: document.getElementById('bodyFat').value || null
    };

    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="inline-block animate-spin">↻</span> Calculating...`;

        // Send request to server
        const response = await fetch('http://localhost:3000/calculate', {
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
        const chartHTML = `
        <div class="mt-8" id="compositionChart">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Body Composition</h3>
            <div class="flex items-center justify-center h-64">
                <div class="relative w-64 h-64">
                    <div id="fatSlice" class="absolute top-0 left-0 w-full h-full rounded-full border-8 border-indigo-100" 
                        style="clip-path: polygon(50% 50%, 50% 0%, 100% 0%);"></div>
                    <div id="leanSlice" class="absolute top-0 left-0 w-full h-full rounded-full border-8 border-indigo-300" 
                        style="clip-path: polygon(50% 50%, 100% 0%, 100% 100%);"></div>
                    <div class="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                        <div class="text-center">
                            <span class="text-3xl font-bold text-indigo-700">${parseFloat(data.bodyFat).toFixed(1)}%</span>
                            <p class="text-gray-600">Body Fat</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex justify-center space-x-8 mt-4">
                <div class="text-center">
                    <p class="text-sm text-gray-500">Fat Mass</p>
                    <p class="font-bold">${(parseFloat(document.getElementById('weight').value) - parseFloat(data.leanMass)).toFixed(1)} kg</p>
                </div>
                <div class="text-center">
                    <p class="text-sm text-gray-500">Lean Mass</p>
                    <p class="font-bold">${parseFloat(data.leanMass).toFixed(1)} kg</p>
                </div>
            </div>
        </div>`;
        resultElement.insertAdjacentHTML('beforeend', chartHTML);

        // Update pie chart visualization
        const fatDegrees = (data.bodyFat / 100) * 360;
        document.getElementById('fatSlice').style.transform = `rotate(${fatDegrees}deg)`;
    }
    // Update macro calculator
    try {
        // Get macros
        const macroResponse = await fetch('http://localhost:3000/calculatemacros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                goal: goal,
                targetCalories: data.targetCalories,
                weight: document.getElementById('weight').value,
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
                'lose': 'lose weight',
                'gain': 'gain muscle',
                'maintain': 'maintain weight'
            }[goal];
            document.getElementById('macroGoalText').textContent = goalText;
        }
    } catch (error) {
        console.error('Macro calculation error:', error);
    }

    
    // Update goal text
    let goalText = '';
    switch(goal) {
        case 'lose': goalText = 'For losing 0.5kg per week'; break;
        case 'gain': goalText = 'For gaining 0.5kg per week'; break;
        default: goalText = 'For maintaining weight';
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
}
