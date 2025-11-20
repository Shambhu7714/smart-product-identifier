

// const API_URL = 'http://localhost:8000/api';

// let selectedFile = null;

// // DOM elements
// const fileInput = document.getElementById('fileInput');
// const uploadBox = document.getElementById('uploadBox');
// const previewSection = document.getElementById('previewSection');
// const previewImage = document.getElementById('previewImage');
// const loadingSection = document.getElementById('loadingSection');
// const errorSection = document.getElementById('errorSection');
// const errorMessage = document.getElementById('errorMessage');
// const resultsSection = document.getElementById('resultsSection');
// const productsGrid = document.getElementById('productsGrid');
// const analyzeBtn = document.getElementById('analyzeBtn');

// // File input change
// fileInput.addEventListener('change', function(e) {
//     const file = e.target.files[0];
//     if (file) {
//         selectedFile = file;
//         displayPreview(file);
//     }
// });

// // Drag and drop
// uploadBox.addEventListener('dragover', (e) => {
//     e.preventDefault();
//     uploadBox.classList.add('dragover');
// });

// uploadBox.addEventListener('dragleave', () => {
//     uploadBox.classList.remove('dragover');
// });

// uploadBox.addEventListener('drop', (e) => {
//     e.preventDefault();
//     uploadBox.classList.remove('dragover');
    
//     const file = e.dataTransfer.files[0];
//     if (file && file.type.startsWith('image/')) {
//         selectedFile = file;
//         displayPreview(file);
//     }
// });

// // Display image preview
// function displayPreview(file) {
//     const reader = new FileReader();
//     reader.onload = function(e) {
//         previewImage.src = e.target.result;
//         previewSection.style.display = 'block';
//         resultsSection.style.display = 'none';
//         errorSection.style.display = 'none';
//     };
//     reader.readAsDataURL(file);
// }

// // Analyze image
// async function analyzeImage() {
//     if (!selectedFile) {
//         showError('Please select an image first');
//         return;
//     }
    
//     const formData = new FormData();
//     formData.append('file', selectedFile);
    
//     // Show loading
//     loadingSection.style.display = 'block';
//     resultsSection.style.display = 'none';
//     errorSection.style.display = 'none';
//     analyzeBtn.disabled = true;
    
//     try {
//         const response = await fetch(`${API_URL}/detect`, {
//             method: 'POST',
//             body: formData
//         });
        
//         if (!response.ok) {
//             throw new Error('Failed to analyze image');
//         }
        
//         const data = await response.json();
        
//         if (data.success) {
//             displayResults(data.products);
//         } else {
//             throw new Error('Analysis failed');
//         }
        
//     } catch (error) {
//         showError('Error: ' + error.message);
//     } finally {
//         loadingSection.style.display = 'none';
//         analyzeBtn.disabled = false;
//     }
// }

// // Display results - grouped by company/brand
// function displayResults(products) {
//     productsGrid.innerHTML = '';
    
//     console.log('Raw products received:', products);
    
//     if (!products || products.length === 0) {
//         productsGrid.innerHTML = `
//             <div class="no-products">
//                 No products detected in the image.<br>
//                 Try uploading a clearer image with visible products.
//             </div>
//         `;
//     } else {
//         // Group products by company/brand
//         const groupedProducts = groupByCompany(products);
//         console.log('Grouped products:', groupedProducts);
        
//         // Display each company section
//         Object.keys(groupedProducts).sort().forEach(company => {
//             const companyData = groupedProducts[company];
            
//             console.log(`Creating section for ${company} with ${companyData.products.length} products, total: ${companyData.total}%`);
            
//             // Create company section
//             const companySection = document.createElement('div');
//             companySection.className = 'company-section';
            
//             // Company header with total percentage
//             const companyHeader = document.createElement('div');
//             companyHeader.className = 'company-header';
//             companyHeader.innerHTML = `
//                 <h3>${escapeHtml(company)}</h3>
//                 <div class="company-total">Total: ${companyData.total.toFixed(1)}%</div>
//                 <div class="percentage-bar company-bar">
//                     <div class="percentage-fill" style="width: ${Math.min(companyData.total, 100)}%"></div>
//                 </div>
//             `;
//             companySection.appendChild(companyHeader);
            
//             // Products grid for this company
//             const companyProductsGrid = document.createElement('div');
//             companyProductsGrid.className = 'company-products-grid';
            
//             companyData.products.forEach(product => {
//                 const card = document.createElement('div');
//                 card.className = 'product-card';
//                 card.innerHTML = `
//                     <div class="product-name">${escapeHtml(product.product_name)}</div>
//                     <div class="product-percentage">${product.percentage.toFixed(1)}%</div>
//                     <div class="percentage-bar">
//                         <div class="percentage-fill" style="width: ${Math.min(product.percentage, 100)}%"></div>
//                     </div>
//                 `;
//                 companyProductsGrid.appendChild(card);
//             });
            
//             companySection.appendChild(companyProductsGrid);
//             productsGrid.appendChild(companySection);
//         });
//     }
    
//     resultsSection.style.display = 'block';
// }

// // Group products by company/brand
// function groupByCompany(products) {
//     const grouped = {};
    
//     products.forEach(product => {
//         const company = extractCompany(product.product_name);
        
//         if (!grouped[company]) {
//             grouped[company] = {
//                 products: [],
//                 total: 0
//             };
//         }
        
//         grouped[company].products.push(product);
//         grouped[company].total += product.percentage;
//     });
    
//     return grouped;
// }

// // Extract company/brand name from product name
// function extractCompany(productName) {
//     const name = productName.toLowerCase();
    
//     // Mobile brands
//     if (name.includes('xiaomi') || name.includes('redmi') || name.includes('mi ')) {
//         return 'Xiaomi/Redmi/Mi';
//     }
//     if (name.includes('realme')) return 'Realme';
//     if (name.includes('samsung')) return 'Samsung';
//     if (name.includes('iphone') || name.includes('apple')) return 'Apple';
//     if (name.includes('vivo')) return 'Vivo';
//     if (name.includes('oppo')) return 'Oppo';
//     if (name.includes('oneplus')) return 'OnePlus';
//     if (name.includes('nokia')) return 'Nokia';
//     if (name.includes('motorola') || name.includes('moto')) return 'Motorola';
//     if (name.includes('poco')) return 'POCO';
    
//     // Snacks/Food brands
//     if (name.includes('lays') || name.includes("lay's")) return 'Lays';
//     if (name.includes('kurkure')) return 'Kurkure';
//     if (name.includes('bingo')) return 'Bingo';
//     if (name.includes('doritos')) return 'Doritos';
//     if (name.includes('pringles')) return 'Pringles';
//     if (name.includes('cheetos')) return 'Cheetos';
//     if (name.includes('haldiram')) return 'Haldirams';
//     if (name.includes('bikaji')) return 'Bikaji';
    
//     // Beverages
//     if (name.includes('coca cola') || name.includes('coke')) return 'Coca Cola';
//     if (name.includes('pepsi')) return 'Pepsi';
//     if (name.includes('sprite')) return 'Sprite';
//     if (name.includes('fanta')) return 'Fanta';
//     if (name.includes('mountain dew')) return 'Mountain Dew';
//     if (name.includes('thumbs up')) return 'Thumbs Up';
//     if (name.includes('limca')) return 'Limca';
    
//     // Electronics
//     if (name.includes('sony')) return 'Sony';
//     if (name.includes('lg')) return 'LG';
//     if (name.includes('dell')) return 'Dell';
//     if (name.includes('hp')) return 'HP';
//     if (name.includes('lenovo')) return 'Lenovo';
//     if (name.includes('asus')) return 'Asus';
//     if (name.includes('acer')) return 'Acer';
    
//     // If no brand detected, use first word or "Other"
//     const firstWord = productName.split(' ')[0];
//     return firstWord.length > 2 ? firstWord : 'Other Products';
// }

// // Show error
// function showError(message) {
//     errorMessage.textContent = '❌ ' + message;
//     errorSection.style.display = 'block';
//     setTimeout(() => {
//         errorSection.style.display = 'none';
//     }, 5000);
// }

// // Escape HTML
// function escapeHtml(text) {
//     const div = document.createElement('div');
//     div.textContent = text;
//     return div.innerHTML;
// }

// // Get history (optional feature)
// async function getHistory() {
//     try {
//         const response = await fetch(`${API_URL}/history`);
//         const data = await response.json();
        
//         if (data.success) {
//             console.log('Detection History:', data.data);
//         }
//     } catch (error) {
//         console.error('Error fetching history:', error);
//     }
// }

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
fileInput.addEventListener('change', function(e) {
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
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        previewSection.style.display = 'block';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
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
    
    // Show loading
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
    analyzeBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/detect`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to analyze image');
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data.products);
        } else {
            throw new Error('Analysis failed');
        }
        
    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        loadingSection.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

// Display results - grouped by company/brand
function displayResults(products) {
    productsGrid.innerHTML = '';
    
    console.log('Raw products received:', products);
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div class="no-products">
                No products detected in the image.<br>
                Try uploading a clearer image with visible products.
            </div>
        `;
    } else {
        // Calculate total percentage
        const totalPercentage = products.reduce((sum, p) => sum + p.percentage, 0);
        console.log('Total percentage:', totalPercentage);
        
        // Show total at top
        const totalDiv = document.createElement('div');
        totalDiv.className = 'total-percentage';
        totalDiv.innerHTML = `
            <strong>Total Coverage: ${totalPercentage.toFixed(1)}%</strong>
            ${totalPercentage < 99.9 || totalPercentage > 100.1 ? 
                '<span class="warning"> (Should be 100%)</span>' : 
                '<span class="success"> ✓</span>'}
        `;
        productsGrid.appendChild(totalDiv);
        
        // Group products by company/brand
        const groupedProducts = groupByCompany(products);
        console.log('Grouped products:', groupedProducts);
        
        // Display each company section
        Object.keys(groupedProducts).sort().forEach(company => {
            const companyData = groupedProducts[company];
            
            console.log(`Creating section for ${company} with ${companyData.products.length} products, total: ${companyData.total}%`);
            
            // Create company section
            const companySection = document.createElement('div');
            companySection.className = 'company-section';
            
            // Company header with total percentage
            const companyHeader = document.createElement('div');
            companyHeader.className = 'company-header';
            companyHeader.innerHTML = `
                <h3>${escapeHtml(company)}</h3>
                <div class="company-total">Total: ${companyData.total.toFixed(1)}%</div>
                <div class="percentage-bar company-bar">
                    <div class="percentage-fill" style="width: ${Math.min(companyData.total, 100)}%"></div>
                </div>
            `;
            companySection.appendChild(companyHeader);
            
            // Products grid for this company
            const companyProductsGrid = document.createElement('div');
            companyProductsGrid.className = 'company-products-grid';
            
            companyData.products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-name">${escapeHtml(product.product_name)}</div>
                    <div class="product-percentage">${product.percentage.toFixed(1)}%</div>
                    <div class="percentage-bar">
                        <div class="percentage-fill" style="width: ${Math.min(product.percentage, 100)}%"></div>
                    </div>
                `;
                companyProductsGrid.appendChild(card);
            });
            
            companySection.appendChild(companyProductsGrid);
            productsGrid.appendChild(companySection);
        });
    }
    
    resultsSection.style.display = 'block';
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