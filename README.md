Healthcare Fraud Detection Web Application
1. Project Overview
This project is a full-stack web application designed to detect potential healthcare fraud among providers using machine learning. The application allows users to upload raw healthcare data (beneficiary details, inpatient claims, and outpatient claims), which is then processed to train a Random Forest model. The model predicts which providers in a test set are potentially fraudulent and presents the results in a user-friendly web interface.

The application is built with a Python Flask back-end for data processing and model training, and an HTML, CSS, and JavaScript front-end for user interaction.

2. Features
Easy-to-Use Web Interface: Upload all 8 required data files directly in the browser.

Automated Machine Learning Pipeline: The back-end automatically processes the data, engineers features, trains a model, and makes predictions.

Rich Results Display:

Prediction Summary: A pie chart showing the distribution of fraudulent vs. non-fraudulent providers.

Key Fraud Indicators: A bar chart displaying the most important features the model used for its predictions.

Results Preview: An on-screen table showing the first 15 predictions.

Downloadable Predictions: A button to download the complete list of predictions as a .csv file.

3. Project Structure
The project is organized into a standard Flask application structure to keep the code clean and maintainable.

healthcare_fraud_app/
│
├── static/                 # Front-end files (CSS, JavaScript)
│   ├── style.css
│   └── script.js
│
├── templates/              # HTML templates
│   └── index.html
│
├── uploads/                # Temporary storage for uploaded files
│
├── app.py                  # The main Flask application and ML logic
├── requirements.txt        # List of Python dependencies
└── README.md               # This documentation file
4. Setup and Installation
Follow these steps to set up and run the project on your local machine.

Prerequisites
Python 3.7+: Make sure you have Python installed. You can check by running python --version.

Step-by-Step Instructions
1. Set Up the Project Folder:
Create the project folder and navigate into it. Make sure all the files (app.py, requirements.txt, etc.) and subfolders (static, templates, uploads) are in the correct places as shown in the structure above.

2. Create and Activate a Virtual Environment (Highly Recommended):
A virtual environment keeps the project's dependencies isolated from other Python projects.

Create the environment:

Bash

python -m venv venv
Activate the environment:

On Windows:

Bash

venv\Scripts\activate
On macOS/Linux:

Bash

source venv/bin/activate
Your terminal prompt should now show (venv) at the beginning.

3. Install Dependencies:
Install all the required Python libraries from the requirements.txt file.

Bash

pip install -r requirements.txt
5. How to Run the Application
With the setup complete, starting the web server is a single command.

1. Start the Flask Server:
Make sure you are in the root healthcare_fraud_app/ directory and your virtual environment is activated. Then run:

Bash

python app.py
2. Access the Application:
Once the server is running, you will see output in your terminal, including a line like this:

 * Running on http://127.0.0.1:5000
Open your web browser (like Chrome or Firefox) and navigate to http://127.0.0.1:5000.

6. How to Use the Application
The application is designed to be straightforward.

Upload Files: On the main page, you will see 8 file input boxes. Click each one to select the corresponding .csv file from your computer. All 8 files are required.

Start Analysis: Once all files are selected, click the "Start Analysis" button.

View Results: The analysis may take a few moments. Once complete, the results section will appear, showing:

The Prediction Summary pie chart.

The Key Fraud Indicators bar chart.

The Prediction Results Preview table.

A green "Download Full Predictions CSV" button to save all results locally.

7. Technology Stack
Back-end:

Python: The core programming language.

Flask: A micro web framework for running the server.

Pandas: For data manipulation and processing.

Scikit-learn: For training the Random Forest machine learning model.

Matplotlib: For generating the visualizations.

Front-end:

HTML: For the structure of the webpage.

CSS: For styling the user interface.

JavaScript: For handling file uploads and communicating with the Flask back-end.
