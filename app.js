const wishlist = []; const salesEvents = ['Black Friday', 'Cyber Monday'];

function parseCSV(file) {
 try { 
   const reader = new FileReader();
   reader.onload = (e) => {
     const content = e.target.result;
     const lines = content.split('\n');
     if (!lines.length) return;
     const headers = lines[0].split(',');
     const dataRows = lines.slice(1).map(line => line.split(','));

     // Check for required columns
     const hasName = headers.includes('product name') || headers.includes('Product Name');
     const hasCategory = headers.includes('category') || headers.includes('Category');
     const hasPrice = headers.includes('current price') || headers.includes('Current Price');

     if (!hasName || !hasCategory || !hasPrice) {
       document.getElementById('upload-status').textContent = 'Invalid CSV: Missing required columns';
       return;
     }

     // Map data rows to objects with consistent keys
     const items = [];
     for (const row of dataRows) {
       if (row.length < 3) continue;
       const item = {
         product: row[0].trim(),
         category: row[1].trim(),
         price: parseFloat(row[2]) || 0
       };
       items.push(item);
     }

     wishlist.clear();
     wishlist.push(...items);
     document.getElementById('upload-status').textContent = 'CSV uploaded successfully!';
   };
   reader.readAsText(file);
 } catch (error) {
   console.error(error);
   document.getElementById('upload-status').textContent = 'Error parsing CSV: ' + error.message;
 }
}

function renderResults() {
 const filterSalesEvent = document.getElementById('sales-event').value.trim();
 const filterCategory = document.getElementById('category-filter').value.trim();
 
 const filteredWishlist = wishlist.filter(item => (
   (filterSalesEvent === '' || item.product.includes(filterSalesEvent)) &&
   (filterCategory === '' || item.category.toLowerCase().includes(filterCategory.toLowerCase()))
 ));

 const resultsHTML = filteredWishlist.map(item => `
 <div class="result-item">
   <strong>${item.product}</strong>
   <span>Category: ${item.category}</span>
   <span>Price: $${item.price.toFixed(2)}</span>
 </div>`).join('\n');

 document.getElementById('results-container').innerHTML = resultsHTML;
}

// Initialize with sample data
const sampleData = [
  { product: 'Wireless Headphones', category: 'Electronics', price: 149.99 },
  { product: 'Smartwatch', category: 'Wearables', price: 249.99 },
  { product: 'Running Shoes', category: 'Sports', price: 89.99 }
];

wishlist.push(...sampleData);
renderResults();

// Event listeners
document.getElementById('upload-btn').addEventListener('click', () => {
  const fileInput = document.getElementById('csv-upload');
  if (fileInput.files.length) {
    parseCSV(fileInput.files[0]);
  }
});

document.getElementById('sales-event').addEventListener('input', renderResults);

document.getElementById('category-filter').addEventListener('input', renderResults);