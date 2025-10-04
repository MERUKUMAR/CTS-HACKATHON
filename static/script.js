document.getElementById('upload-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const statusContainer = document.getElementById('status-container');
    const resultsContainer = document.getElementById('results-container');
    const statusText = document.getElementById('status-text');

    statusContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    statusText.textContent = "Uploading files and running analysis... This may take a few moments.";
    statusText.style.color = '#555';

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server responded with status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // Charts
            loadCharts(result);

            // Download button
            const downloadBtn = document.getElementById('download-btn');
            downloadBtn.href = result.predictions_url;
            downloadBtn.classList.remove('hidden');

            // Results table
            await displayResultsTable(result.predictions_url);

            statusContainer.classList.add('hidden');
            resultsContainer.classList.remove('hidden');
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error('Error:', error);
        statusText.textContent = `Error: ${error.message}`;
        statusText.style.color = 'red';
    }
});

// Function to render Chart.js charts
function loadCharts(result) {
    // Pie chart
    const pieCtx = document.getElementById('fraud-pie-chart').getContext('2d');
    new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: result.pie_labels || ['Fraudulent', 'Non-Fraudulent'],
            datasets: [{
                data: result.pie_values || [120, 880],
                backgroundColor: ['#e74c3c', '#2ecc71'],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    enabled: true
                }
            }
        }
    });

    // Bar chart
    const barCtx = document.getElementById('importance-chart').getContext('2d');
    new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: result.feature_labels || ['ClaimAmt', 'HospitalVisits', 'DiagnosisCount', 'Age'],
            datasets: [{
                label: 'Feature Importance',
                data: result.feature_values || [0.8, 0.6, 0.4, 0.3],
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: { enabled: true }
            },
            scales: {
                y: { beginAtZero: true, max: 1 }
            }
        }
    });
}

// Display CSV table preview
async function displayResultsTable(csvUrl) {
    const tableContainer = document.getElementById('results-table');
    tableContainer.innerHTML = '';

    try {
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        const rows = csvText.trim().split('\n');

        if (rows.length === 0) return;

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        rows[0].split(',').forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        for (let i = 1; i < Math.min(rows.length, 16); i++) {
            const row = document.createElement('tr');
            rows[i].split(',').forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                if (cellText.trim().toLowerCase() === 'yes' || cellText.trim().toLowerCase() === 'fraudulent') {
                    td.classList.add('fraud-yes');
                }
                row.appendChild(td);
            });
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        tableContainer.appendChild(table);

    } catch (error) {
        console.error('Failed to display results table:', error);
        tableContainer.textContent = 'Could not load prediction results preview.';
    }
}
