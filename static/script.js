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
            const cacheBuster = '?t=' + new Date().getTime();
            // --- UPDATE: Populate both charts ---
            document.getElementById('importance-chart').src = result.feature_importance_url + cacheBuster;
            document.getElementById('fraud-pie-chart').src = result.pie_chart_url + cacheBuster;
            
            const downloadBtn = document.getElementById('download-btn');
            downloadBtn.href = result.predictions_url;
            downloadBtn.classList.remove('hidden');
            
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

async function displayResultsTable(csvUrl) {
    const tableContainer = document.getElementById('results-table');
    tableContainer.innerHTML = ''; 
    try {
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        const rows = csvText.trim().split('\n');
        
        if (rows.length === 0) return;

        const table = document.createElement('table');
        const a_header = document.createElement('thead');
        const headerRow = document.createElement('tr');
        rows[0].split(',').forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        a_header.appendChild(headerRow);
        table.appendChild(a_header);

        const a_body = document.createElement('tbody');
        for (let i = 1; i < Math.min(rows.length, 16); i++) {
            const row = document.createElement('tr');
            rows[i].split(',').forEach(cellText => {
                const td = document.createElement('td');
                td.textContent = cellText;
                if (cellText === 'Yes') {
                    td.classList.add('fraud-yes');
                }
                row.appendChild(td);
            });
            a_body.appendChild(row);
        }
        table.appendChild(a_body);
        tableContainer.appendChild(table);

    } catch (error) {
        console.error('Failed to display results table:', error);
        tableContainer.textContent = 'Could not load prediction results preview.';
    }
}