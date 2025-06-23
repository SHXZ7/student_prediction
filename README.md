**🎓 Student Performance Predictor**

An intelligent, end-to-end web application that predicts student academic outcomes using advanced machine learning and provides personalized recommendations based on risk factors.

**🚀 Built with Next.js, FastAPI, and Scikit-learn**

**📊 Features**

✨ Interactive Frontend UI built with Next.js + Tailwind CSS + Framer Motion

🧠 AI-Powered Predictions using an ensemble of ML models (Random Forest, SVM, GBM)

⚠️ Risk Factor Detection and visual explanation

💡 Actionable Recommendations based on student habits, background, and health

🔎 SHAP Explainability for model transparency (optional)

📈 Model Training Pipeline with hyperparameter tuning and feature engineering

📦 REST API Backend with FastAPI serving the model

🧪 Demo Preview

![Screenshot 2025-06-23 173511](https://github.com/user-attachments/assets/053d0a14-680d-428f-996b-105b38963a69)
![Screenshot 2025-06-23 174614](https://github.com/user-attachments/assets/c4652ad1-c177-4b2b-bd2a-932ce5e0b51a)


**🛠️ Tech Stack**

Frontend	Backend	Machine Learning
Next.js + Tailwind	FastAPI + Pydantic	Scikit-learn, SHAP
Framer Motion	CORS Middleware	RandomForest, SVM, GBM

**📁 Project Structure**

├── frontend/              # Next.js frontend
│   └── src/app/page.js    # Main UI logic
├── backend/               # FastAPI backend
│   ├── main.py            # API endpoints and prediction logic
│   └── model/             # Saved models and metadata
├── model/                 # Model training logic
│   └── train_model.py     # Full training pipeline


**🧠 How It Works**

Frontend (React + Next.js):

Multi-step form collects student data.

On submission, form sends data to FastAPI /predict endpoint.

Results are displayed with probability, confidence, risk factors, and recommendations.

Backend (FastAPI):

Loads trained ML model.

Reconstructs engineered features from input.

Performs prediction and returns structured response.

Training Pipeline:

train_model.py performs feature engineering, training with GridSearchCV, SHAP explanations, and saves the best model.


**🚦 Prediction Output Example**

json
Copy
Edit
{
  "result": "Pass",
  "probability": 0.82,
  "confidence": "High",
  "risk_factors": {
    "alcohol": "High alcohol consumption",
    "attendance": "High absences: 18"
  },
  "recommendations": [
    "📚 Increase study time",
    "🎯 Improve attendance",
    "⚠️ Reduce alcohol consumption",
    "✅ You are doing great!"
  ]
}
