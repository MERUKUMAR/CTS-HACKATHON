import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import matplotlib
matplotlib.use('Agg') # Use a non-interactive backend suitable for servers
import matplotlib.pyplot as plt
from flask import Flask, request, render_template, jsonify
import warnings

warnings.filterwarnings('ignore')

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        results_folder = os.path.join('static', 'results')
        os.makedirs(results_folder, exist_ok=True)

        files = request.files
        if len(files) != 8:
            return jsonify({'success': False, 'error': 'Please upload all 8 files.'}), 400
            
        file_paths = {}
        for key, file in files.items():
            path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(path)
            file_paths[key] = path
        
        print("Loading data...")
        train_beneficiary = pd.read_csv(file_paths['trainBeneficiary'])
        train_inpatient = pd.read_csv(file_paths['trainInpatient'])
        train_outpatient = pd.read_csv(file_paths['trainOutpatient'])
        train_labels = pd.read_csv(file_paths['trainLabels'])
        test_beneficiary = pd.read_csv(file_paths['testBeneficiary'])
        test_inpatient = pd.read_csv(file_paths['testInpatient'])
        test_outpatient = pd.read_csv(file_paths['testOutpatient'])
        test_providers = pd.read_csv(file_paths['testProviders'])
        
        def engineer_features(inpatient_df, outpatient_df, beneficiary_df):
            print("Engineering features...")
            inpatient_df['is_inpatient'] = 1
            outpatient_df['is_inpatient'] = 0
            all_claims = pd.concat([inpatient_df, outpatient_df], ignore_index=True)
            full_data = pd.merge(all_claims, beneficiary_df, on='BeneID', how='left')
            chronic_cols = [col for col in full_data.columns if 'ChronicCond' in col]
            for col in chronic_cols:
                full_data[col] = full_data[col].replace(2, 0)
            full_data['NumChronicConditions'] = full_data[chronic_cols].sum(axis=1)
            provider_features = full_data.groupby('Provider').agg(
                num_claims=('ClaimID', 'nunique'),
                num_patients=('BeneID', 'nunique'),
                total_claim_amount=('InscClaimAmtReimbursed', 'sum'),
                avg_claim_amount=('InscClaimAmtReimbursed', 'mean'),
                inpatient_ratio=('is_inpatient', 'mean'),
                avg_num_chronic_conditions=('NumChronicConditions', 'mean')
            ).reset_index().fillna(0)
            return provider_features

        train_features = engineer_features(train_inpatient, train_outpatient, train_beneficiary)
        test_features = engineer_features(test_inpatient, test_outpatient, test_beneficiary)
        
        final_train_df = pd.merge(train_features, train_labels, on='Provider')
        final_train_df['PotentialFraud'] = final_train_df['PotentialFraud'].map({'Yes': 1, 'No': 0})

        feature_names = [col for col in final_train_df.columns if col not in ['Provider', 'PotentialFraud']]
        X_train = final_train_df[feature_names]
        y_train = final_train_df['PotentialFraud']

        print("Training Random Forest model...")
        model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)

        print("Making predictions...")
        test_df_aligned = pd.merge(test_providers, test_features, on='Provider', how='left').fillna(0)
        X_test = test_df_aligned[feature_names]
        predictions = model.predict(X_test)
        test_df_aligned['PotentialFraud'] = pd.Series(predictions).map({1: 'Yes', 0: 'No'})

        predictions_filename = "predictions.csv"
        predictions_filepath = os.path.join(results_folder, predictions_filename)
        test_df_aligned[['Provider', 'PotentialFraud']].to_csv(predictions_filepath, index=False)

        print("Creating visualizations...")
        # Visualization 1: Feature Importance
        importances = model.feature_importances_
        feature_importance_df = pd.DataFrame({'feature': feature_names, 'importance': importances})
        feature_importance_df = feature_importance_df.sort_values('importance', ascending=True).tail(10)
        plt.figure(figsize=(10, 7))
        plt.barh(feature_importance_df['feature'], feature_importance_df['importance'], color='#007bff')
        plt.xlabel('Importance')
        plt.title('Top 10 Key Fraud Indicators')
        plt.tight_layout()
        viz_filename = "feature_importance.png"
        viz_filepath = os.path.join(results_folder, viz_filename)
        plt.savefig(viz_filepath)
        plt.close()

        # --- NEW VISUALIZATION: FRAUD DISTRIBUTION PIE CHART ---
        fraud_counts = test_df_aligned['PotentialFraud'].value_counts()
        plt.figure(figsize=(8, 8))
        plt.pie(fraud_counts, labels=fraud_counts.index, autopct='%1.1f%%', 
                colors=['#28a745', '#dc3545'], startangle=90,
                wedgeprops={'edgecolor': 'white'})
        plt.title('Distribution of Predicted Fraudulent Providers')
        pie_chart_filename = "fraud_distribution.png"
        pie_chart_filepath = os.path.join(results_folder, pie_chart_filename)
        plt.savefig(pie_chart_filepath)
        plt.close()
        # --------------------------------------------------------

        return jsonify({
            'success': True,
            'predictions_url': f'/static/results/{predictions_filename}',
            'feature_importance_url': f'/static/results/{viz_filename}',
            'pie_chart_url': f'/static/results/{pie_chart_filename}' # <-- Added new URL
        })

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)