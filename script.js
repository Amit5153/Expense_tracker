const addExpenseBtn = document.querySelector(".add-expense-btn");
const addExpenseList = document.querySelector(".expense-list");
const totalExpensesEl = document.querySelector("#total-expenses");

let expenses = [];
let total = 0;

// Load expenses from localStorage when the page loads
window.onload = function () {
    const savedExpenses = localStorage.getItem("expenses");
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
        renderExpenses();
        updateCategoryChart();
        updateTimeChart();
    }
};

// Render Expenses List
function renderExpenses(filteredExpenses = expenses) {
    addExpenseList.innerHTML = ""; // Clear the list first
    filteredExpenses.forEach((expense, index) => {
        const expenseItem = document.createElement("li");
        expenseItem.className = "expense-item";
        expenseItem.innerHTML = `
            ${expense.name}: $${expense.amount} 
            <small>(${expense.date})</small> - <em>${expense.category}</em>
            <span class="delete-btn" data-index="${index}">X</span>
        `;
        addExpenseList.appendChild(expenseItem);
    });
    updateTotal(filteredExpenses);
}

// Update Total Expenses
function updateTotal(filteredExpenses = expenses) {
    total = filteredExpenses.reduce((acc, expense) => acc + expense.amount, 0);
    totalExpensesEl.textContent = total.toFixed(2);
}

// Add New Expense
function addExpense() {
    const expenseName = document.querySelector("#expense-name").value;
    const expenseAmount = parseFloat(document.querySelector("#expense-amount").value);
    const expenseDate = document.querySelector("#expense-date").value;
    const expenseCategory = document.querySelector("#expense-category").value;

    if (expenseName && !isNaN(expenseAmount) && expenseDate && expenseCategory) {
        expenses.push({
            name: expenseName,
            amount: expenseAmount,
            date: expenseDate,
            category: expenseCategory
        });
        document.querySelector("#expense-name").value = "";
        document.querySelector("#expense-amount").value = "";
        document.querySelector("#expense-date").value = "";
        document.querySelector("#expense-category").value = "General";

        saveExpensesToLocalStorage();
        renderExpenses();
        updateCategoryChart();
        updateTimeChart();
    } else {
        alert("Please enter a valid expense name, amount, date, and category.");
    }
}

// Delete Expense
function deleteExpense(index) {
    expenses.splice(index, 1);
    saveExpensesToLocalStorage();
    renderExpenses();
    updateCategoryChart();
    updateTimeChart();
}

// Save Expenses to Local Storage
function saveExpensesToLocalStorage() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Filter Expenses by Date Range and Category
function filterExpenses() {
    const startDate = document.querySelector("#start-date").value;
    const endDate = document.querySelector("#end-date").value;
    const categoryFilter = document.querySelector("#filter-category").value;

    let filteredExpenses = expenses;

    // Filter by date range
    if (startDate && endDate) {
        filteredExpenses = filteredExpenses.filter(expense =>
            new Date(expense.date) >= new Date(startDate) && new Date(expense.date) <= new Date(endDate)
        );
    }

    // Filter by category
    if (categoryFilter !== "All") {
        filteredExpenses = filteredExpenses.filter(expense => expense.category === categoryFilter);
    }

    renderExpenses(filteredExpenses);
    updateCategoryChart(filteredExpenses);
    updateTimeChart(filteredExpenses);
}

// Initialize Chart Instances
let categoryChart, timeChart;

function initializeCharts() {
    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    const ctxTime = document.getElementById('timeChart').getContext('2d');

    categoryChart = new Chart(ctxCategory, {
        type: 'pie',
        data: {
            labels: [], // Categories will be filled dynamically
            datasets: [{
                label: 'Expenses by Category',
                data: [], // Data will be filled dynamically
                backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8'],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });

    timeChart = new Chart(ctxTime, {
        type: 'line',
        data: {
            labels: [], // Dates will be filled dynamically
            datasets: [{
                label: 'Expenses Over Time',
                data: [], // Data will be filled dynamically
                fill: false,
                borderColor: '#007bff',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

// Function to Update Category Chart Data
function updateCategoryChart(filteredExpenses = expenses) {
    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    categoryChart.data.labels = Object.keys(categoryTotals);
    categoryChart.data.datasets[0].data = Object.values(categoryTotals);
    categoryChart.update();
}

// Function to Update Time Chart Data
function updateTimeChart(filteredExpenses = expenses) {
    const dateTotals = filteredExpenses.reduce((acc, expense) => {
        acc[expense.date] = (acc[expense.date] || 0) + expense.amount;
        return acc;
    }, {});

    timeChart.data.labels = Object.keys(dateTotals).sort(); // Sort dates
    timeChart.data.datasets[0].data = Object.values(dateTotals);
    timeChart.update();
}

// Event Listeners
addExpenseBtn.addEventListener("click", addExpense);

// Event delegation for delete buttons
addExpenseList.addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-btn")) {
        const index = event.target.getAttribute("data-index");
        deleteExpense(index);
    }
});

// Filter expenses on filter input change
document.querySelector("#filter-btn").addEventListener("click", filterExpenses);

// Initialize Charts on Page Load
window.onload = function () {
    const savedExpenses = localStorage.getItem("expenses");
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
        renderExpenses();
    }
    initializeCharts(); // Initialize charts when the page loads
    updateCategoryChart(); // Update chart after loading expenses
    updateTimeChart(); // Update chart after loading expenses
};

function exportToCSV() {
    const selectedFields = getSelectedFields(); // A function to get the selected fields from the UI

    let csvContent = "data:text/csv;charset=utf-8,";

    // Dynamically create CSV header based on selected fields
    csvContent += selectedFields.map(field => capitalize(field)).join(",") + "\n";

    // Add expense data rows dynamically based on selected fields
    expenses.forEach(expense => {
        let row = selectedFields.map(field => expense[field]).join(",");
        csvContent += `${row}\n`;
    });

    // Create a downloadable link and click it
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses_custom.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function getSelectedFields() {
    // Example function: Fetches selected fields from checkboxes or a multi-select dropdown
    const checkboxes = document.querySelectorAll(".field-checkbox:checked");
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}



function exportToJSON() {
    const selectedFields = getSelectedFields(); // Use the same function to get selected fields

    // Create a new JSON object with only the selected fields
    const filteredExpenses = expenses.map(expense => {
        const filteredExpense = {};
        selectedFields.forEach(field => {
            filteredExpense[field] = expense[field];
        });
        return filteredExpense;
    });

    const jsonContent = JSON.stringify(filteredExpenses, null, 2); // Pretty-print JSON with indentation

    // Create a downloadable link and click it
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "expenses_custom.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



function exportToPDF() {
    const { jsPDF } = window.jspdf; // Import jsPDF from the window object
    const doc = new jsPDF(); // Create a new instance of jsPDF

    const selectedFields = getSelectedFields(); // Fields to include
    const customHeader = "My Custom Expense Report"; // Example: Get from a user input field

    doc.setFontSize(16);
    doc.text(customHeader, 20, 20);

    // Get user-selected customization options
    const tableTheme = document.getElementById("table-theme").value;
    const fontSize = parseInt(document.getElementById("font-size").value, 10);
    const cellPadding = parseInt(document.getElementById("cell-padding").value, 10);
    const borderColor = document.getElementById("border-color").value;
    const textAlignment = document.getElementById("text-alignment").value;

    // Dynamically add table headers based on selected fields
    const headers = [selectedFields.map(field => capitalize(field))];
    const data = expenses.map(expense => selectedFields.map(field => expense[field]));

    // Add the table using the autoTable plugin with user-selected options
    doc.autoTable({
        head: headers,
        body: data,
        startY: 30, // Start position below the title
        styles: {
            fontSize: fontSize, // Apply user-selected font size
            cellPadding: cellPadding, // Apply user-selected cell padding
            halign: textAlignment, // Apply user-selected text alignment
            lineColor: borderColor, // Apply user-selected border color
            lineWidth: 0.5,
        },
        theme: tableTheme, // Apply user-selected theme
        headStyles: {
            fillColor: [0, 123, 255] // Customize header color if needed
        },
        margin: { top: 20 }
    });

    // Generate and add QR code
    const qrText = " hey everyone"; // Use a dynamic URL for real applications
    const qrCode = new QRCode({
        content: qrText,
        width: 128,
        height: 128,
        color: "#00000",
        background: "#ffffff",
    });

    // Convert QR code to data URL and add it to PDF
    qrCode.toDataURL(function (dataUrl) {
        doc.addImage(dataUrl, "PNG", 150, doc.internal.pageSize.height - 160, 40, 40); // Adjust position and size as needed
    });

    // Add footer if desired
    doc.text("Generated by Expense Tracker", 20, doc.internal.pageSize.height - 10);

    // Save the generated PDF
    doc.save("expenses_custom.pdf");
}

// Event listener for export button
document.getElementById("export-pdf").addEventListener("click", exportToPDF);



function exportToPDFWithQRCode() {
    const { jsPDF } = window.jspdf; // Import jsPDF from the window object
    const doc = new jsPDF(); // Create a new instance of jsPDF
    
    const selectedFields = getSelectedFields(); // Fields to include
    const customHeader = "My Custom Expense Report"; // Example: Get from a user input field

    doc.setFontSize(16);
    doc.text(customHeader, 20, 20);

    // Dynamically add table headers based on selected fields
    const headers = [selectedFields.map(field => capitalize(field))];
    const data = expenses.map(expense => selectedFields.map(field => expense[field]));

    // Add the table using the autoTable plugin
    doc.autoTable({
        head: headers,
        body: data,
        startY: 30, // Start position below the title
        styles: {
            fontSize: 10,
            cellPadding: 4,
        },
        theme: "striped",
        headStyles: {
            fillColor: [0, 123, 255]
        },
        margin: { top: 20 }
    });

    // Generate QR Code and Add it to the PDF
    const qrText = "www.youtube.com"; // The text or URL for the QR code
    const qrOptions = { width: 128, margin: 1 }; // Customize QR code size and margin

    // Generate QR code using the QRCode library
    QRCode.toDataURL(qrText, qrOptions, (err, url) => {
        if (err) {
            console.error("QR Code generation failed: ", err);
            return;
        }

        // Add the QR code image to the PDF at the specified location (x, y)
        doc.addImage(url, "PNG", 140, 250, 50, 50); // Adjust the coordinates and size as needed

        // Add footer if desired
        doc.text("Generated by Expense Tracker", 20, doc.internal.pageSize.height - 10);

        // Save the generated PDF
        doc.save("expenses_with_qrcode.pdf");
         window.open("expenses_with_qrcode.pdf", "_blank"); 
    });
}




// Event listeners for export buttons
document.getElementById("export-csv").addEventListener("click", exportToCSV);
document.getElementById("export-json").addEventListener("click", exportToJSON);
document.getElementById("export-pdf").addEventListener("click", exportToPDFWithQRCode);
document.getElementById("export-pdf").addEventListener("click", exportToPDF);   
