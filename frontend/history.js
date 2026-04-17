// History Page Logic
let historyData = [];
let animationId = null;

// Canvas setup
const canvas = document.getElementById('trendChart');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('chartTooltip');

// Responsive canvas sizing
function resizeCanvas() {
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = 250 * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = '250px';
    
    ctx.scale(dpr, dpr);
    
    if (historyData.length > 0) {
        animateChart();
    }
}

// Draw grid lines
function drawGrid(width, height, padding, xLabels, yMin, yMax) {
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0';
    ctx.lineWidth = 1;
    
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Horizontal grid lines
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const y = padding + (chartHeight / ySteps) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Vertical grid lines (for data points)
    if (xLabels.length > 1) {
        xLabels.forEach((_, index) => {
            const x = padding + (chartWidth / (xLabels.length - 1)) * index;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        });
    }
}

// Plot data points on the chart
function plotDataPoints(data, width, height, padding, yMin, yMax) {
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    data.forEach((record, index) => {
        const x = padding + (chartWidth / (data.length - 1 || 1)) * index;
        const y = padding + chartHeight - ((record.bmi_value - yMin) / (yMax - yMin)) * chartHeight;
        
        const color = getBMIColor(record.category);
        
        // Draw point
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Store coordinates for tooltip
        record._x = x;
        record._y = y;
    });
}

// Draw trend line
function drawTrendLine(data, width, height, padding, yMin, yMax, progress) {
    if (data.length < 2) return;
    
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Calculate linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    data.forEach((record, index) => {
        sumX += index;
        sumY += record.bmi_value;
        sumXY += index * record.bmi_value;
        sumXX += index * index;
    });
    
    const slope = (data.length * sumXY - sumX * sumY) / (data.length * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / data.length;
    
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    
    const startX = padding;
    const startY = padding + chartHeight - ((slope * 0 + intercept - yMin) / (yMax - yMin)) * chartHeight;
    
    const endIndex = Math.floor((data.length - 1) * progress);
    const endX = padding + (chartWidth / (data.length - 1)) * endIndex;
    const endY = padding + chartHeight - ((slope * endIndex + intercept - yMin) / (yMax - yMin)) * chartHeight;
    
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Animate chart drawing
function animateChart() {
    if (animationId) cancelAnimationFrame(animationId);
    
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    const padding = 40;
    
    const bmiValues = historyData.map(r => r.bmi_value);
    const yMin = Math.floor(Math.min(...bmiValues)) - 1;
    const yMax = Math.ceil(Math.max(...bmiValues)) + 1;
    
    let progress = 0;
    const duration = 800;
    const startTime = performance.now();
    
    function render(currentTime) {
        progress = Math.min((currentTime - startTime) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        ctx.clearRect(0, 0, width, height);
        
        drawGrid(width, height, padding, historyData, yMin, yMax);
        drawTrendLine(historyData, width, height, padding, yMin, yMax, easeProgress);
        
        if (progress >= 1) {
            plotDataPoints(historyData, width, height, padding, yMin, yMax);
        }
        
        if (progress < 1) {
            animationId = requestAnimationFrame(render);
        }
    }
    
    animationId = requestAnimationFrame(render);
}

// Handle hover for tooltips
function setupChartHover() {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        let hoveredPoint = null;
        let minDistance = 20;
        
        historyData.forEach(record => {
            if (record._x !== undefined) {
                const distance = Math.sqrt(Math.pow(x - record._x, 2) + Math.pow(y - record._y, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    hoveredPoint = record;
                }
            }
        });
        
        if (hoveredPoint) {
            tooltip.classList.remove('hidden');
            tooltip.style.left = `${hoveredPoint._x}px`;
            tooltip.style.top = `${hoveredPoint._y - 10}px`;
            const categoryInfo = getCategoryInfo(hoveredPoint.category);
            tooltip.innerHTML = `
                <div class="font-semibold">${hoveredPoint.bmi_value.toFixed(1)} BMI</div>
                <div class="text-xs opacity-80">${categoryInfo.label}</div>
                <div class="text-xs opacity-60">${formatDate(hoveredPoint.created_at)}</div>
            `;
            canvas.style.cursor = 'pointer';
        } else {
            tooltip.classList.add('hidden');
            canvas.style.cursor = 'default';
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        tooltip.classList.add('hidden');
    });
}

// Fetch and display history
async function fetchAndDisplayHistory() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const historyContent = document.getElementById('historyContent');
    
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    historyContent.classList.add('hidden');
    
    try {
        const response = await apiCall('/bmi/history');
        loadingState.classList.add('hidden');
        
        if (!response.data || response.data.length === 0) {
            emptyState.classList.remove('hidden');
            historyData = [];
            return;
        }
        
        historyData = response.data;
        calculateSummaryStats();
        renderHistoryList();
        resizeCanvas();
        historyContent.classList.remove('hidden');
    } catch (error) {
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }
}

// Calculate summary statistics
function calculateSummaryStats() {
    const bmiValues = historyData.map(r => r.bmi_value);
    const average = bmiValues.reduce((a, b) => a + b, 0) / bmiValues.length;
    const min = Math.min(...bmiValues);
    const max = Math.max(...bmiValues);
    
    // Calculate trend (compare first half vs second half)
    const midPoint = Math.floor(historyData.length / 2);
    const firstHalf = historyData.slice(0, midPoint).map(r => r.bmi_value);
    const secondHalf = historyData.slice(midPoint).map(r => r.bmi_value);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const trend = secondAvg - firstAvg;
    
    // Update summary cards
    document.getElementById('averageBMI').textContent = average.toFixed(1);
    const avgCategory = getBMICategory(average);
    document.getElementById('averageCategory').textContent = getCategoryInfo(avgCategory).label;
    
    document.getElementById('totalEntries').textContent = historyData.length;
    
    // Update trend
    const trendIcon = document.getElementById('trendIcon');
    const trendText = document.getElementById('trendText');
    const trendDesc = document.getElementById('trendDescription');
    
    if (Math.abs(trend) < 0.5) {
        trendIcon.className = 'w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center';
        trendIcon.innerHTML = '<svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>';
        trendText.textContent = 'Stable';
        trendDesc.textContent = 'BMI has remained consistent';
    } else if (trend > 0) {
        trendIcon.className = 'w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center';
        trendIcon.innerHTML = '<svg class="w-4 h-4 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>';
        trendText.textContent = 'Up';
        trendDesc.textContent = `BMI increased by ${trend.toFixed(1)}`;
    } else {
        trendIcon.className = 'w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center';
        trendIcon.innerHTML = '<svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';
        trendText.textContent = 'Down';
        trendDesc.textContent = `BMI decreased by ${Math.abs(trend).toFixed(1)}`;
    }
}

// Render history list
function renderHistoryList() {
    const container = document.getElementById('historyList');
    container.innerHTML = '';
    
    historyData.forEach((record, index) => {
        const categoryInfo = getCategoryInfo(record.category);
        const unit = record.unit_system === 'metric' ? 'cm/kg' : 'in/lb';
        
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all hover:scale-[1.01]';
        card.style.animationDelay = `${index * 0.05}s`;
        card.innerHTML = `
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background-color: ${categoryInfo.color}20">
                <svg class="w-6 h-6" style="color: ${categoryInfo.color}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-xl font-bold text-slate-900 dark:text-white">${record.bmi_value.toFixed(1)}</span>
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full" style="background-color: ${categoryInfo.color}20; color: ${categoryInfo.color}">${categoryInfo.label}</span>
                </div>
                <div class="text-sm text-slate-500 dark:text-slate-400">
                    <span class="font-mono">${record.height} / ${record.weight}</span>
                    <span class="text-xs text-slate-400 ml-2">(${unit})</span>
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm text-slate-600 dark:text-slate-300">${formatDate(record.created_at)}</div>
                <div class="text-xs text-slate-400">${formatTime(record.created_at)}</div>
            </div>
            <button onclick="deleteRecord(${record.id}, ${record.bmi_value})" class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors" title="Delete record">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
        `;
        container.appendChild(card);
    });
}

// Delete a record
async function deleteRecord(id, bmiValue) {
    const confirmed = confirm(`Are you sure you want to delete this BMI record (${bmiValue.toFixed(1)})? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
        await apiCall(`/bmi/history/${id}`, { method: 'DELETE' });
        showToast('Record deleted successfully', 'success');
        await fetchAndDisplayHistory();
    } catch (error) {
        showToast('Failed to delete record', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('resize', debounce(resizeCanvas, 200));
    setupChartHover();
    fetchAndDisplayHistory();
});