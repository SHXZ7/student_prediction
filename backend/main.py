from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import os
import pandas as pd
import numpy as np
from typing import Dict, Any

app = FastAPI(title="Student Performance Prediction API")

# ✅ CORS to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load trained model and metadata
model_path = os.path.join("model", "student_model.joblib")
metadata_path = os.path.join("model", "model_metadata.joblib")

try:
    model = joblib.load(model_path)
    metadata = joblib.load(metadata_path)
    print("✅ Model loaded successfully!")
    print(f"   Model: {metadata['model_name']}")
    print(f"   Accuracy: {metadata['accuracy']:.4f}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None
    metadata = None

# ✅ Enhanced input model matching training features
class StudentInput(BaseModel):
    # Basic academic features
    studytime: int = Field(..., ge=1, le=4, description="Weekly study time (1-4)")
    failures: int = Field(..., ge=0, le=3, description="Number of past class failures (0-3)")
    absences: int = Field(..., ge=0, le=93, description="Number of school absences (0-93)")
    health: int = Field(..., ge=1, le=5, description="Current health status (1-5)")
    
    # Support systems
    schoolsup: str = Field(..., pattern="^(yes|no)$", description="Extra educational support")
    famsup: str = Field(..., pattern="^(yes|no)$", description="Family educational support")
    paid: str = Field(..., pattern="^(yes|no)$", description="Extra paid classes")
    activities: str = Field(..., pattern="^(yes|no)$", description="Extra-curricular activities")
    higher: str = Field(..., pattern="^(yes|no)$", description="Wants to take higher education")
    
    # Family background
    Medu: int = Field(..., ge=0, le=4, description="Mother's education (0-4)")
    Fedu: int = Field(..., ge=0, le=4, description="Father's education (0-4)")
    famrel: int = Field(..., ge=1, le=5, description="Quality of family relationships (1-5)")
    Pstatus: str = Field(..., pattern="^(T|A)$", description="Parent's cohabitation status (T/A)")
    
    # Social factors
    goout: int = Field(..., ge=1, le=5, description="Going out with friends (1-5)")
    Dalc: int = Field(..., ge=1, le=5, description="Workday alcohol consumption (1-5)")
    Walc: int = Field(..., ge=1, le=5, description="Weekend alcohol consumption (1-5)")
    freetime: int = Field(..., ge=1, le=5, description="Free time after school (1-5)")
    romantic: str = Field(..., pattern="^(yes|no)$", description="In a romantic relationship")
    
    # School factors
    internet: str = Field(..., pattern="^(yes|no)$", description="Internet access at home")
    nursery: str = Field(..., pattern="^(yes|no)$", description="Attended nursery school")
    reason: str = Field(..., description="Reason to choose this school")

class PredictionResponse(BaseModel):
    result: str
    probability: float
    confidence: str
    risk_factors: Dict[str, Any]
    recommendations: list

def create_engineered_features(data: pd.DataFrame) -> pd.DataFrame:
    """Create the same engineered features as in training"""
    df = data.copy()
    
    # Total alcohol consumption
    df['total_alcohol'] = df['Dalc'] + df['Walc']
    
    # Family support score
    df['family_support_score'] = (
        df['famsup'].map({'yes': 1, 'no': 0}) + 
        df['famrel'] + 
        (df['Pstatus'].map({'T': 1, 'A': 0}) * 2)
    )
    
    # Social score
    df['social_score'] = df['goout'] + df['freetime']
    
    # Academic support
    df['academic_support'] = (
        df['schoolsup'].map({'yes': 1, 'no': 0}) + 
        df['paid'].map({'yes': 1, 'no': 0}) + 
        df['activities'].map({'yes': 1, 'no': 0})
    )
    
    # Parent education
    df['parent_education'] = df['Medu'] + df['Fedu']
    
    # Risk factors
    df['risk_factors'] = (
        df['failures'] * 2 + 
        df['total_alcohol'] + 
        (5 - df['health']) +  # Lower health = higher risk
        df['absences'] / 10
    )
    
    # Motivation score
    df['motivation_score'] = (
        df['higher'].map({'yes': 2, 'no': 0}) + 
        df['studytime'] + 
        (5 - df['goout'])  # Less going out = more motivated
    )
    
    return df

def analyze_risk_factors(data: Dict) -> Dict[str, Any]:
    """Analyze individual risk factors"""
    risks = {}
    
    # Academic risks
    if data['failures'] > 0:
        risks['academic'] = f"Has {data['failures']} past failures"
    if data['absences'] > 10:
        risks['attendance'] = f"High absences: {data['absences']}"
    if data['studytime'] < 2:
        risks['study_habits'] = "Low study time"
    
    # Social risks
    total_alcohol = data['Dalc'] + data['Walc']
    if total_alcohol > 6:
        risks['alcohol'] = "High alcohol consumption"
    if data['goout'] > 3:
        risks['social'] = "Frequent social activities"
    
    # Support risks
    if data['famsup'] == 'no':
        risks['family_support'] = "No family educational support"
    if data['schoolsup'] == 'no' and data['failures'] > 0:
        risks['school_support'] = "No school support despite past failures"
    
    # Health risks
    if data['health'] < 3:
        risks['health'] = "Poor health status"
    
    return risks

def generate_recommendations(data: Dict, prediction: int, risks: Dict) -> list:
    """Generate personalized recommendations"""
    recommendations = []
    
    # Academic recommendations
    if data['failures'] > 0 or data['studytime'] < 2:
        recommendations.append("📚 Increase study time - aim for at least 2-4 hours per week")
    
    if data['absences'] > 10:
        recommendations.append("🎯 Improve attendance - regular attendance is crucial for success")
    
    # Support recommendations
    if 'family_support' in risks:
        recommendations.append("👨‍👩‍👧‍👦 Seek additional family support for studies")
    
    if 'school_support' in risks:
        recommendations.append("🏫 Consider enrolling in school support programs")
    
    # Social/lifestyle recommendations
    if 'alcohol' in risks:
        recommendations.append("⚠️ Reduce alcohol consumption - it impacts academic performance")
    
    if data['goout'] > 3 and data['studytime'] < 2:
        recommendations.append("⚖️ Balance social activities with study time")
    
    # Health recommendations
    if data['health'] < 3:
        recommendations.append("💪 Focus on improving health - consider counseling or medical support")
    
    # Positive reinforcements
    if data['higher'] == 'yes':
        recommendations.append("🎓 Great motivation for higher education - keep it up!")
    
    if data['internet'] == 'yes':
        recommendations.append("💻 Use internet resources for additional learning materials")
    
    # Default recommendation if doing well
    if prediction == 1 and len(risks) == 0:
        recommendations.append("✅ Keep up the excellent work! You're on track for success")
    
    return recommendations

@app.get("/")
def root():
    return {"message": "Student Performance Prediction API", "status": "active"}

@app.get("/model-info")
def get_model_info():
    """Get information about the loaded model"""
    if not model or not metadata:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    return {
        "model_name": metadata['model_name'],
        "accuracy": metadata['accuracy'],
        "features_count": len(metadata['features']),
        "status": "ready"
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(data: StudentInput):
    """Make prediction with detailed analysis"""
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Convert input to dataframe
        input_dict = data.dict()
        input_df = pd.DataFrame([input_dict])
        
        # Create engineered features
        enhanced_df = create_engineered_features(input_df)
        
        # Select only the features used in training
        if metadata and 'features' in metadata:
            # Ensure all required features are present
            for feature in metadata['features']:
                if feature not in enhanced_df.columns:
                    # Handle missing features by setting reasonable defaults
                    if feature in ['nursery', 'reason']:
                        enhanced_df[feature] = 'other'  # Default for categorical
                    else:
                        enhanced_df[feature] = 0  # Default for numerical
            
            # Select features in the same order as training
            enhanced_df = enhanced_df[metadata['features']]
        
        # Make prediction
        prediction = model.predict(enhanced_df)[0]
        prediction_proba = model.predict_proba(enhanced_df)[0]
        
        # Get probability for positive class (pass)
        pass_probability = prediction_proba[1] if len(prediction_proba) > 1 else prediction_proba[0]
        
        # Determine result with nuanced threshold
        if pass_probability >= 0.6:
            result = "Pass"
        elif pass_probability >= 0.4:
            result = "Borderline"
        else:
            result = "Fail"

        # Update confidence logic to match new thresholds
        if pass_probability > 0.8 or pass_probability < 0.2:
            confidence = "High"
        elif 0.6 <= pass_probability <= 0.8 or 0.2 <= pass_probability <= 0.4:
            confidence = "Medium"
        else:
            confidence = "Low"

        # Analyze risk factors and limit to top 3
        risks = analyze_risk_factors(input_dict)
        top_risks = dict(list(risks.items())[:3])

        # Generate recommendations
        recommendations = generate_recommendations(input_dict, prediction, risks)

        # Add status message
        status_msg = (
            "🚨 At risk of failing. Focus on key areas." if result == "Fail" else
            "⚖️ Borderline case. You can improve!" if result == "Borderline" else
            "✅ You are doing great!"
        )

        return PredictionResponse(
            result=result,
            probability=round(pass_probability, 3),
            confidence=confidence,
            risk_factors=top_risks,
            recommendations=recommendations + [status_msg]
        )
        
    except Exception as e:
        print(f"❌ Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict-simple")
def predict_simple(data: StudentInput):
    """Simple prediction endpoint for backward compatibility"""
    try:
        result = predict(data)
        return {"result": result.result, "probability": result.probability}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)