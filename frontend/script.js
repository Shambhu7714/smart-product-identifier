
const API_URL = 'http://localhost:8000/api';

let selectedFile = null;

// DOM elements
const fileInput = document.getElementById('fileInput');
const uploadBox = document.getElementById('uploadBox');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const loadingSection = document.getElementById('loadingSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const resultsSection = document.getElementById('resultsSection');
const productsGrid = document.getElementById('productsGrid');
const analyzeBtn = document.getElementById('analyzeBtn');

// File input change
fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        selectedFile = file;
        displayPreview(file);
    }
});

// Drag and drop
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        selectedFile = file;
        displayPreview(file);
    }
});

// Display image preview
function displayPreview(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        previewImage.src = e.target.result;
        previewSection.style.display = 'block';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
        analyzeBtn.disabled = false; // ✅ ensures always clickable
    };
    reader.readAsDataURL(file);
}

// Analyze image
async function analyzeImage() {
    if (!selectedFile) {
        showError('Please select an image first');
        return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Show loading with animation
    uploadBox.style.display = 'none';
    previewSection.style.display = 'none';
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
    analyzeBtn.disabled = true;

    // Animate processing steps
    animateProcessingSteps();

    try {
        const response = await fetch(`${API_URL}/detect`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to analyze image');
        }

        const data = await response.json();

        // Wait only if animation is still running (ensure min time for visual effect)
        // We let the animation run its course in parallel

        if (data.success) {
            // Force complete animation if it's lagging or ensure it finishes
            completeAllSteps();
            setTimeout(() => {
                displayResults(data.products);
            }, 800); // Small delay to see the final green ticks
        } else {
            throw new Error('Analysis failed');
        }

    } catch (error) {
        showError('Error: ' + error.message);
        loadingSection.style.display = 'none';
        uploadBox.style.display = 'block'; // Ensure user can try again
        analyzeBtn.disabled = false;
    } finally {
        // Cleanup handled in displayResults or error
    }
}

// Global state for animation
let animationState = {
    currentStep: 0,
    intervalId: null
};

// Animate processing steps strictly sequentially
function animateProcessingSteps() {
    const steps = ['step1', 'step2', 'step3'];
    const messages = [
        '🔍 Scanning products in the image...',
        '🧠 AI is analyzing product details...',
        '📊 Calculating presence percentages...'
    ];

    // RESET first
    resetProcessingSteps();

    // Start Step 1
    updateStepVisuals(0, 'active');
    document.getElementById('processingStatus').textContent = messages[0];

    let stepIndex = 0;

    // Clear any existing interval
    if (animationState.intervalId) clearInterval(animationState.intervalId);

    // Progress naturally every 1.5s
    animationState.intervalId = setInterval(() => {
        // Complete current step
        updateStepVisuals(stepIndex, 'completed');

        stepIndex++;

        if (stepIndex < steps.length) {
            // Activate next step
            updateStepVisuals(stepIndex, 'active');
            document.getElementById('processingStatus').textContent = messages[stepIndex];
        } else {
            // Finished natural cycle, wait for API
            clearInterval(animationState.intervalId);
            document.getElementById('processingStatus').textContent = 'Finalizing results...';
        }
    }, 2000); // Slower, more deliberate timing
}

function updateStepVisuals(index, status) {
    const ids = ['step1', 'step2', 'step3'];
    if (index >= ids.length) return;

    const el = document.getElementById(ids[index]);
    if (!el) return;

    // Remove all utility classes first to be safe
    el.classList.remove('active', 'completed', 'pending');

    if (status === 'active') {
        el.classList.add('active');
        // Ensure icon is spinning or highlighting
    } else if (status === 'completed') {
        el.classList.add('completed');
    } else {
        el.classList.add('pending');
    }
}

function completeAllSteps() {
    if (animationState.intervalId) clearInterval(animationState.intervalId);

    const steps = ['step1', 'step2', 'step3'];
    steps.forEach((id, index) => {
        updateStepVisuals(index, 'completed');
    });
    document.getElementById('processingStatus').textContent = 'Analysis Complete!';
}

// Reset processing steps
function resetProcessingSteps() {
    if (animationState.intervalId) clearInterval(animationState.intervalId);

    const steps = ['step1', 'step2', 'step3'];
    steps.forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove('active', 'completed');
        el.classList.add('pending'); // Add a pending state stylistically
    });
}

// Display results - Fully Dynamic Treemap
function displayResults(products) {
    const productsGrid = document.getElementById('productsGrid');
    const dashboardStats = document.getElementById('dashboardStats');

    productsGrid.innerHTML = '';
    dashboardStats.innerHTML = '';

    console.log('Raw products received:', products);

    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                No products detected in the image.<br>
                Try uploading a clearer image with visible products.
            </div>
        `;
        return;
    }

    // Calculate total percentage
    const totalPercentage = products.reduce((sum, p) => sum + p.percentage, 0);
    console.log('Total percentage:', totalPercentage);

    // Dashboard Stats
    const scannedCount = document.getElementById('scannedCount');
    const detectedCount = document.getElementById('detectedCount');
    const uniqueCount = document.getElementById('uniqueCount');

    // Simple unique products count
    const uniqueProducts = new Set(products.map(p => p.product_name)).size;

    if (scannedCount) scannedCount.textContent = products.length;
    if (detectedCount) detectedCount.textContent = products.length; // Assuming all are detected
    if (uniqueCount) uniqueCount.textContent = uniqueProducts;

    // Sort products by percentage (largest first)
    const sortedProducts = [...products].sort((a, b) => b.percentage - a.percentage);

    // Show results section first so we can measure its actual available space (due to flexbox)
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'flex';
    resultsSection.style.flexDirection = 'column';

    // Get actual available container width and height
    const containerWidth = productsGrid.clientWidth || 1200;

    // Now that it's visible, offsetHeight will give the actual flexed height
    const containerHeight = productsGrid.offsetHeight || 600;

    console.log(`Rendering Treemap: ${containerWidth}x${containerHeight}`);

    // Generate treemap layout that EXACTLY fits within container dimensions
    const layout = generateDynamicTreemap(sortedProducts, containerWidth, containerHeight);

    layout.forEach((box) => {
        const treemapBox = document.createElement('div');
        treemapBox.className = 'treemap-box';

        // Set absolute positioning
        treemapBox.style.left = `${box.x}px`;
        treemapBox.style.top = `${box.y}px`;
        treemapBox.style.width = `${box.width}px`;
        treemapBox.style.height = `${box.height}px`;

        // Dynamic color based on ranking
        const colorClass = getDynamicColor(box.product, sortedProducts);
        treemapBox.classList.add(colorClass);

        // Responsive font sizing
        const fontSize = calculateFontSize(box.width, box.height);

        // Smart text handling
        const displayName = getDisplayText(box.product.product_name, box.width, fontSize.name);

        treemapBox.innerHTML = `
            <div class="treemap-content">
                <div class="treemap-ticker" style="font-size: ${fontSize.name}px">${escapeHtml(displayName)}</div>
                <div class="treemap-percentage" style="font-size: ${fontSize.percent}px">${box.product.percentage.toFixed(1)}%</div>
            </div>
            <div class="treemap-tooltip">${escapeHtml(box.product.product_name)}: ${box.product.percentage.toFixed(1)}%</div>
        `;

        productsGrid.appendChild(treemapBox);
    });
}

// Reset UI for new analysis
function resetToUpload() {
    selectedFile = null;
    fileInput.value = '';
    uploadBox.style.display = 'block';
    previewSection.style.display = 'none';
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
}

// Dynamic Treemap Generator - Squarified Algorithm
function generateDynamicTreemap(products, containerWidth, containerHeight) {
    const totalValue = products.reduce((sum, p) => sum + p.percentage, 0);
    const normalizedProducts = products.map(p => ({
        ...p,
        normalizedValue: (p.percentage / totalValue) * (containerWidth * containerHeight)
    }));

    return squarify(normalizedProducts, 0, 0, containerWidth, containerHeight);
}

// Squarified Treemap Algorithm (Industry Standard)
function squarify(items, x, y, width, height) {
    if (items.length === 0) return [];
    if (items.length === 1) {
        return [{
            product: items[0],
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(width),
            height: Math.round(height)
        }];
    }

    const totalArea = width * height;
    const boxes = [];

    // Sort by value for better aspect ratios
    const sorted = [...items].sort((a, b) => b.normalizedValue - a.normalizedValue);

    let remaining = [...sorted];
    let currentX = x;
    let currentY = y;
    let availableWidth = width;
    let availableHeight = height;

    while (remaining.length > 0) {
        // Determine layout direction based on aspect ratio
        const horizontal = availableWidth >= availableHeight;

        // Find best row/column that minimizes aspect ratio
        const row = getBestRow(remaining, horizontal ? availableWidth : availableHeight, horizontal);

        // Calculate total value in row
        const rowTotal = row.reduce((sum, item) => sum + item.normalizedValue, 0);
        const remainingTotal = remaining.reduce((sum, item) => sum + item.normalizedValue, 0);
        const rowRatio = rowTotal / remainingTotal;

        if (horizontal) {
            // Horizontal layout - boxes stacked vertically in a column
            const stripWidth = availableWidth * rowRatio;
            let offsetY = currentY;

            row.forEach(item => {
                const itemRatio = item.normalizedValue / rowTotal;
                const itemHeight = availableHeight * itemRatio;

                boxes.push({
                    product: item,
                    x: Math.round(currentX),
                    y: Math.round(offsetY),
                    width: Math.max(30, Math.round(stripWidth - 1)), // Min width 30px
                    height: Math.max(30, Math.round(itemHeight - 1)) // Min height 30px
                });
                offsetY += itemHeight;
            });

            currentX += stripWidth;
            availableWidth -= stripWidth;
        } else {
            // Vertical layout - boxes arranged horizontally in a row
            const stripHeight = availableHeight * rowRatio;
            let offsetX = currentX;

            row.forEach(item => {
                const itemRatio = item.normalizedValue / rowTotal;
                const itemWidth = availableWidth * itemRatio;

                boxes.push({
                    product: item,
                    x: Math.round(offsetX),
                    y: Math.round(currentY),
                    width: Math.max(30, Math.round(itemWidth - 1)), // Min width 30px
                    height: Math.max(30, Math.round(stripHeight - 1)) // Min height 30px
                });
                offsetX += itemWidth;
            });

            currentY += stripHeight;
            availableHeight -= stripHeight;
        }

        // Remove processed items from remaining
        remaining = remaining.filter(item => !row.includes(item));
    }

    return boxes;
}

// Get optimal row for squarified treemap
function getBestRow(items, length, horizontal) {
    if (items.length === 0) return [];
    if (items.length === 1) return [items[0]];
    if (items.length === 2) return items.slice(0, 2);

    // Try different row sizes and pick best aspect ratio
    let bestRow = [items[0]];
    let bestRatio = Infinity;

    for (let i = 1; i <= Math.min(items.length, 4); i++) {
        const row = items.slice(0, i);
        const ratio = calculateWorstAspectRatio(row, length);

        if (ratio < bestRatio) {
            bestRatio = ratio;
            bestRow = row;
        } else {
            break; // Aspect ratio getting worse
        }
    }

    return bestRow;
}

// Calculate worst aspect ratio for a row
function calculateWorstAspectRatio(row, length) {
    const total = row.reduce((sum, item) => sum + item.normalizedValue, 0);
    const minVal = Math.min(...row.map(item => item.normalizedValue));
    const maxVal = Math.max(...row.map(item => item.normalizedValue));

    const lengthSquared = length * length;
    const totalSquared = total * total;

    return Math.max(
        (lengthSquared * maxVal) / totalSquared,
        totalSquared / (lengthSquared * minVal)
    );
}

// Dynamic color assignment based on percentile
function getDynamicColor(product, allProducts) {
    const index = allProducts.findIndex(p => p.product_name === product.product_name);
    const total = allProducts.length;
    const percentile = (index / total) * 100;

    // Color spectrum: Green (top) → Yellow → Orange → Red (bottom)
    if (percentile < 15) return 'color-green-dark';
    if (percentile < 30) return 'color-green';
    if (percentile < 50) return 'color-green-light';
    if (percentile < 70) return 'color-yellow';
    if (percentile < 85) return 'color-red-light';
    return 'color-red';
}

// Calculate responsive font sizes
function calculateFontSize(width, height) {
    const area = width * height;
    const minDimension = Math.min(width, height);

    // Name font size
    let nameSize = 10;
    if (area > 40000) nameSize = 14;
    else if (area > 25000) nameSize = 13;
    else if (area > 15000) nameSize = 12;
    else if (area > 8000) nameSize = 11;
    else if (minDimension < 60) nameSize = 8;

    // Percentage font size
    let percentSize = nameSize * 1.6;
    if (area < 5000) percentSize = nameSize * 1.3;
    if (minDimension < 60) percentSize = nameSize * 1.2;

    return {
        name: nameSize,
        percent: percentSize
    };
}

// Smart text display based on available width
function getDisplayText(text, width, fontSize) {
    const avgCharWidth = fontSize * 0.6;
    const maxChars = Math.floor((width - 16) / avgCharWidth);

    if (maxChars < 5) return text.substring(0, 3) + '..';
    if (text.length <= maxChars) return text;

    // Try to break at word boundary
    const truncated = text.substring(0, maxChars - 3);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxChars / 2) {
        return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
}


// Group products by company/brand
function groupByCompany(products) {
    const grouped = {};

    products.forEach(product => {
        const company = extractCompany(product.product_name);

        if (!grouped[company]) {
            grouped[company] = {
                products: [],
                total: 0
            };
        }

        grouped[company].products.push(product);
        grouped[company].total += product.percentage;
    });

    return grouped;
}

// Extract company/brand name from product name
function extractCompany(productName) {
    const name = productName.toLowerCase();

    // Mobile brands
    if (name.includes('xiaomi') || name.includes('redmi') || name.includes('mi ')) {
        return 'Xiaomi/Redmi/Mi';
    }
    if (name.includes('realme')) return 'Realme';
    if (name.includes('samsung')) return 'Samsung';
    if (name.includes('iphone') || name.includes('apple')) return 'Apple';
    if (name.includes('vivo')) return 'Vivo';
    if (name.includes('oppo')) return 'Oppo';
    if (name.includes('oneplus')) return 'OnePlus';
    if (name.includes('nokia')) return 'Nokia';
    if (name.includes('motorola') || name.includes('moto')) return 'Motorola';
    if (name.includes('poco')) return 'POCO';

    // Snacks/Food brands
    if (name.includes('lays') || name.includes("lay's")) return 'Lays';
    if (name.includes('kurkure')) return 'Kurkure';
    if (name.includes('bingo')) return 'Bingo';
    if (name.includes('doritos')) return 'Doritos';
    if (name.includes('pringles')) return 'Pringles';
    if (name.includes('cheetos')) return 'Cheetos';
    if (name.includes('haldiram')) return 'Haldirams';
    if (name.includes('bikaji')) return 'Bikaji';

    // Beverages
    if (name.includes('coca cola') || name.includes('coke')) return 'Coca Cola';
    if (name.includes('pepsi')) return 'Pepsi';
    if (name.includes('sprite')) return 'Sprite';
    if (name.includes('fanta')) return 'Fanta';
    if (name.includes('mountain dew')) return 'Mountain Dew';
    if (name.includes('thumbs up')) return 'Thumbs Up';
    if (name.includes('limca')) return 'Limca';

    // Electronics
    if (name.includes('sony')) return 'Sony';
    if (name.includes('lg')) return 'LG';
    if (name.includes('dell')) return 'Dell';
    if (name.includes('hp')) return 'HP';
    if (name.includes('lenovo')) return 'Lenovo';
    if (name.includes('asus')) return 'Asus';
    if (name.includes('acer')) return 'Acer';

    // If no brand detected, use first word or "Other"
    const firstWord = productName.split(' ')[0];
    return firstWord.length > 2 ? firstWord : 'Other Products';
}

// Show error
function showError(message) {
    errorMessage.textContent = '❌ ' + message;
    errorSection.style.display = 'block';
    setTimeout(() => {
        errorSection.style.display = 'none';
    }, 5000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Get history (optional feature)
async function getHistory() {
    try {
        const response = await fetch(`${API_URL}/history`);
        const data = await response.json();

        if (data.success) {
            console.log('Detection History:', data.data);
        }
    } catch (error) {
        console.error('Error fetching history:', error);
    }
}

function downloadResult() {
    if (!lastResult) return;

    const blob = new Blob(
        [JSON.stringify(lastResult, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${lastResult.image_name}_result.json`;
    a.click();

    URL.revokeObjectURL(url);
}


async function toggleHistory() {
    const historySection = document.getElementById("historySection");
    const historyContent = document.getElementById("historyContent");
    const historyBackdrop = document.getElementById("historyBackdrop");

    const isOpen = historySection.style.display === "block";

    if (isOpen) {
        historySection.style.display = "none";
        historyBackdrop.style.display = "none";
        return;
    }

    historySection.style.display = "block";
    historyBackdrop.style.display = "block";
    historyContent.innerHTML = `<p class="loading-text">Loading history...</p>`;
    await loadHistory();
}



// Load history from API
async function loadHistory() {
    const historyContent = document.getElementById('historyContent');

    try {
        const response = await fetch(`${API_URL}/history`);
        const data = await response.json();

        if (!data.success || !data.data || data.data.length === 0) {
            historyContent.innerHTML = `
                <div class="no-history">
                    <p>📭 No detection history found</p>
                    <p class="hint">Upload and analyze images to build your history</p>
                </div>
            `;
            return;
        }

        // Display history items
        historyContent.innerHTML = data.data.map((item, index) => {
            const date = new Date(item.upload_time);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const totalProducts = item.products.length;
            const topProducts = item.products.slice(0, 3);
            const visibleItems = data.data.slice(0, 20); // load more, show scroll


            return `
                <div class="history-card" onclick="viewHistoryItem(${index})">
                    <div class="history-card-header">
                        <h4>📸 ${escapeHtml(item.image_name)}</h4>
                        <span class="history-date">${formattedDate}</span>
                    </div>
                    <div class="history-card-body">
                        <p class="product-count">${totalProducts} product${totalProducts !== 1 ? 's' : ''} detected</p>
                        <div class="top-products">
                            ${topProducts.map(p => `
                                <span class="product-tag">${escapeHtml(p.product_name)} (${p.percentage.toFixed(1)}%)</span>
                            `).join('')}
                            ${totalProducts > 3 ? `<span class="more-tag">+${totalProducts - 3} more</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        historyContent.innerHTML = `
            <div class="error-message">
                <p>❌ Failed to load history</p>
                <p class="hint">${error.message}</p>
            </div>
        `;
    }
}

// View a specific history item (optional enhancement)
function viewHistoryItem(index) {
    // This could be enhanced to show the full details of a history item
    console.log('Viewing history item:', index);
}
