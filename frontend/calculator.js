let currentUnit = 'metric';
let lastResult = null;

function initCalculator() {
    const saved = localStorage.getItem('bmi-last-calculation');
    if (saved) {
        try {
            lastResult = JSON.parse(saved);
            if (lastResult) {
                document.getElementById('heightInput').value = lastResult.height;
                document.getElementById('weightInput').value = lastResult.weight;
                setUnit(lastResult.unit_system);
                displayResults(lastResult);
            }
        } catch (e) {
            console.error('Failed to load saved calculation:', e);
        }
    }
}

function setUnit(unit) {
    currentUnit = unit;
    const metricBtn = document.getElementById('metricBtn');
    const imperialBtn = document.getElementById('imperialBtn');
    const heightLabel = document.getElementById('heightLabel');
    const weightLabel = document.getElementById('weightLabel');
    const heightInput = document.getElementById('heightInput');
    const weightInput = document.getElementById('weightInput');
    
    if (unit === 'metric') {
        metricBtn.className = 'px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm';
        imperialBtn.className = 'px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 text-slate-600 dark:text-slate-400';
        heightLabel.textContent = 'Height (cm)';
        weightLabel.textContent = 'Weight (kg)';
        heightInput.placeholder = '175';
        weightInput.placeholder = '70';
    } else {
        imperialBtn.className = 'px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm';
        metricBtn.className = 'px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 text-slate-600 dark:text-slate-400';
        heightLabel.textContent = 'Height (in)';
        weightLabel.textContent = 'Weight (lb)';
        heightInput.placeholder = '69';
        weightInput.placeholder = '154';
    }
}

function validateInputs() {
    const heightInput = document.getElementById('heightInput');
    const weightInput = document.getElementById('weightInput');
    const errorEl = document.getElementById('errorMessage');
    
    errorEl.classList.add('hidden');
    
    const height = parseFloat(heightInput.value);
    const weight = parseFloat(weightInput.value);
    
    if (!height || height <= 0) {
        errorEl.textContent = 'Please enter a valid height greater than 0';
        errorEl.classList.remove('hidden');
        heightInput.focus();
        return null;
    }
    
    if (!weight || weight <= 0) {
        errorEl.textContent = 'Please enter a valid weight greater than 0';
        errorEl.classList.remove('hidden');
        weightInput.focus();
        return null;
    }
    
    return { height, weight };
}

async function calculateBMI() {
    const inputs = validateInputs();
    if (!inputs) return;
    
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Calculating...';
    btn.disabled = true;
    
    try {
        const response = await fetch('/api/bmi/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                height: inputs.height,
                weight: inputs.weight,
                unit_system: currentUnit
            })
        });
        
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Calculation failed');
        }
        
        const result = await response.json();
        lastResult = result.data;
        localStorage.setItem('bmi-last-calculation', JSON.stringify(lastResult));
        displayResults(lastResult);
        
    } catch (error) {
        const errorEl = document.getElementById('errorMessage');
        errorEl.textContent = error.message || 'Something went wrong. Please try again.';
        errorEl.classList.remove('hidden');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function getGaugeAngle(bmi) {
    const clampedBMI = Math.max(10, Math.min(45, bmi));
    const minBMI = 10;
    const maxBMI = 45;
    const normalized = (clampedBMI - minBMI) / (maxBMI - minBMI);
    return -90 + (normalized * 180);
}

function animateGauge(targetAngle, duration = 1000) {
    const needle = document.getElementById('gaugeNeedle');
    if (!needle) return;
    
    const startAngle = parseFloat(needle.dataset.currentAngle || -90);
    const startTime = performance.now();
    
    needle.dataset.currentAngle = targetAngle;
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const currentAngle = startAngle + (targetAngle - startAngle) * eased;
        needle.setAttribute('transform', `rotate(${currentAngle}, 100, 100)`);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

function getTailwindColor(category) {
    const colors = {
        underweight: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
        normal: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
        overweight: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
        obese: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
    };
    return colors[category] || colors.normal;
}

function displayResults(result) {
    const resultsSection = document.getElementById('resultsSection');
    const bmiValueEl = document.getElementById('bmiValue');
    const bmiCategoryEl = document.getElementById('bmiCategory');
    const healthTipsEl = document.getElementById('healthTips');
    
    resultsSection.classList.remove('hidden');
    resultsSection.classList.remove('animate-fade-in');
    void resultsSection.offsetWidth;
    resultsSection.classList.add('animate-fade-in');
    
    bmiValueEl.textContent = result.bmi_value.toFixed(1);
    
    bmiCategoryEl.textContent = result.category.charAt(0).toUpperCase() + result.category.slice(1);
    bmiCategoryEl.className = `inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold ${getTailwindColor(result.category)}`;
    
    animateGauge(getGaugeAngle(result.bmi_value));
    
    healthTipsEl.innerHTML = '';
    const tips = Array.isArray(result.health_tips) ? result.health_tips : [];
    
    tips.forEach((tip, index) => {
        const li = document.createElement('li');
        li.className = `flex items-start gap-3 text-slate-700 dark:text-slate-300 opacity-0 animate-slide-up`;
        li.style.animationDelay = `${index * 0.1}s`;
        li.innerHTML = `
            <svg class="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>${tip}</span>
        `;
        healthTipsEl.appendChild(li);
    });
    
    if (tips.length === 0) {
        healthTipsEl.innerHTML = '<li class="text-slate-500 dark:text-slate-400">No health tips available.</li>';
    }
}

function shareResults() {
    if (!lastResult) {
        showToast('No results to share', 'error');
        return;
    }
    
    const text = `My BMI is ${lastResult.bmi_value.toFixed(1)} (${lastResult.category.charAt(0).toUpperCase() + lastResult.category.slice(1)})\n\nTrack your health at BMI Health Tracker!`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => showToast('Results copied to clipboard!', 'success'))
            .catch(() => fallbackShare(text));
    } else {
        fallbackShare(text);
    }
}

function fallbackShare(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showToast('Results copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy results', 'error');
    }
    
    document.body.removeChild(textarea);
}

document.addEventListener('DOMContentLoaded', initCalculator);