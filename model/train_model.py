import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score
from sklearn.feature_selection import SelectKBest, f_classif
import joblib
import os
import warnings
import shap
warnings.filterwarnings('ignore')

class EnhancedStudentModelTrainer:
    def __init__(self, data_path='../dataset/student-mat.csv'):
        self.data_path = data_path
        self.df = None
        self.X = None
        self.y = None
        self.best_model = None
        self.best_score = 0
        self.feature_names = None
        
    def load_and_prepare_data(self):
        """Load and prepare the dataset with enhanced feature engineering"""
        print("📊 Loading and preparing data...")
        
        # Load dataset
        self.df = pd.read_csv(self.data_path)

        
        # Create multiple target variables for different thresholds
        if 'pass' not in self.df.columns and 'G3' in self.df.columns:
         self.df['pass'] = (self.df['G3'] >= 10).astype(int) 

 # Pass/Fail (10+)
        if 'good_grade' not in self.df.columns and 'G3' in self.df.columns:
         self.df['good_grade'] = (self.df['G3'] >= 14).astype(int)  # Good grade (14+)
        
        # Feature engineering - create new meaningful features
        self.df['total_alcohol'] = self.df['Dalc'] + self.df['Walc']
        self.df['family_support_score'] = (
            self.df['famsup'].map({'yes': 1, 'no': 0}) + 
            self.df['famrel'] + 
            (self.df['Pstatus'].map({'T': 1, 'A': 0}) * 2)
        )
        self.df['social_score'] = self.df['goout'] + self.df['freetime']
        self.df['academic_support'] = (
            self.df['schoolsup'].map({'yes': 1, 'no': 0}) + 
            self.df['paid'].map({'yes': 1, 'no': 0}) + 
            self.df['activities'].map({'yes': 1, 'no': 0})
        )
        
        # Educational background score
        self.df['parent_education'] = (
            self.df['Medu'] + self.df['Fedu']
        )
        
        # Risk factors
        self.df['risk_factors'] = (
            self.df['failures'] * 1.0 + 
            self.df['total_alcohol'] + 
            (5 - self.df['health']) +  # Lower health = higher risk
            self.df['absences'] / 10
        )
        
        # Motivation score
        self.df['motivation_score'] = (
            self.df['higher'].map({'yes': 3, 'no': 0}) + 
            self.df['studytime'] * 1.5 + 
            (5 - self.df['goout'])  # Less going out = more motivated
        )
        
        print(f"✅ Dataset loaded: {self.df.shape[0]} students, {self.df.shape[1]} features")
        return self
    
    def select_features(self, target='pass'):
        """Select the most relevant features"""
        print("🎯 Selecting optimal features...")
        
        # Comprehensive feature list
        all_features = [
            # Basic academic features
            'studytime', 'failures', 'absences', 'health',
            
            # Support systems
            'schoolsup', 'famsup', 'paid', 'activities', 'higher',
            
            # Family background
            'Medu', 'Fedu', 'famrel', 'Pstatus',
            
            # Social factors
            'goout', 'Dalc', 'Walc', 'freetime', 'romantic',
            
            # School factors
            'internet', 'nursery', 'reason',
            
            # Engineered features
            'total_alcohol', 'family_support_score', 'social_score',
            'academic_support', 'parent_education', 'risk_factors',
            'motivation_score'
        ]
        
        # Filter features that exist in the dataset
        available_features = [f for f in all_features if f in self.df.columns]
        
        self.X = self.df[available_features]
        self.y = self.df[target]
        
        # Handle categorical variables
        categorical_cols = []
        numerical_cols = []
        
        for col in self.X.columns:
            if self.X[col].dtype == 'object':
                categorical_cols.append(col)
            else:
                numerical_cols.append(col)
        
        self.categorical_cols = categorical_cols
        self.numerical_cols = numerical_cols
        
        print(f"✅ Selected {len(available_features)} features")
        print(f"   - Categorical: {len(categorical_cols)}")
        print(f"   - Numerical: {len(numerical_cols)}")
        
        return self
    
    def create_preprocessor(self):
        """Create preprocessing pipeline"""
        print("🔧 Creating preprocessing pipeline...")
        
        # Preprocessing for numerical and categorical data
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), self.numerical_cols),
                ('cat', OneHotEncoder(handle_unknown='ignore', drop='if_binary'), self.categorical_cols)
            ],
            remainder='passthrough'
        )
        
        self.preprocessor = preprocessor
        return self
    
    def train_multiple_models(self, test_size=0.2, random_state=42):
        """Train and compare multiple models"""
        print("🚀 Training multiple models...")
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            self.X, self.y, test_size=test_size, random_state=random_state, stratify=self.y
        )
        
        # Define models to try
        models = {
            'Random Forest': RandomForestClassifier(random_state=random_state, class_weight="balanced"),
            'Gradient Boosting': GradientBoostingClassifier(random_state=random_state),
            'Logistic Regression': LogisticRegression(
                random_state=random_state, 
                max_iter=5000,
                class_weight="balanced",
                solver='liblinear',
                tol=1e-6
            ),
            'SVM': SVC(probability=True, class_weight="balanced", random_state=random_state),
            'Ensemble (RF+SVM)': VotingClassifier(
                estimators=[
                    ('rf', RandomForestClassifier(random_state=random_state, class_weight="balanced")),
                    ('svm', SVC(random_state=random_state, probability=True, class_weight="balanced"))
                ],
                voting='soft'
            )
        }
        
        # Parameter grids for optimization
        param_grids = {
            'Random Forest': {
                'classifier__n_estimators': [100, 200, 300],
                'classifier__max_depth': [10, 20, None],
                'classifier__min_samples_split': [2, 5, 10],
                'classifier__min_samples_leaf': [1, 2, 4]
 },
            'Gradient Boosting': {
                'classifier__n_estimators': [100, 200],
                'classifier__learning_rate': [0.05, 0.1, 0.2],
                'classifier__max_depth': [3, 5, 7]
         },
            'Logistic Regression': {
               'classifier__C': [0.1, 1, 10, 100],
               'classifier__penalty': ['l1', 'l2'],
               'classifier__solver': ['liblinear']
            },
            'SVM': {
               'classifier__C': [0.1, 1, 10],
               'classifier__kernel': ['rbf', 'linear'],
               'classifier__gamma': ['scale', 'auto']
            },
            'Ensemble (RF+SVM)': {}  # No grid search for ensemble for simplicity
        }
        
        best_models = {}
        results = {}
        
        for name, model in models.items():
            print(f"   Training {name}...")

            pipeline = Pipeline([
                ('preprocessor', self.preprocessor),
                ('classifier', model)
            ])

            grid_search = GridSearchCV(
                pipeline, 
                param_grids[name], 
                cv=5, 
                scoring='f1_macro',
                n_jobs=-1,
                verbose=0
            )

            grid_search.fit(X_train, y_train)

            # Calibrate Gradient Boosting after grid search
            if name == 'Gradient Boosting':
                best_pipeline = grid_search.best_estimator_
                calibrated_pipeline = Pipeline([
                    ('preprocessor', self.preprocessor),
                    ('classifier', CalibratedClassifierCV(
                        best_pipeline.named_steps['classifier'], method='sigmoid', cv=5
                    ))
                ])
                calibrated_pipeline.fit(X_train, y_train)
                model_for_eval = calibrated_pipeline
            # Calibrate SVM after grid search
            elif name == 'SVM':
                best_classifier = grid_search.best_estimator_.named_steps['classifier']
                calibrated_classifier = CalibratedClassifierCV(best_classifier, cv=5, method='sigmoid')
                calibrated_pipeline = Pipeline([
                    ('preprocessor', self.preprocessor),
                    ('classifier', calibrated_classifier)
                ])
                calibrated_pipeline.fit(X_train, y_train)
                model_for_eval = calibrated_pipeline
            else:
                model_for_eval = grid_search

            y_pred = model_for_eval.predict(X_test)
            y_pred_proba = model_for_eval.predict_proba(X_test)[:, 1]

            accuracy = accuracy_score(y_test, y_pred)
            auc_score = roc_auc_score(y_test, y_pred_proba)

            results[name] = {
                'model': model_for_eval,
                'accuracy': accuracy,
                'auc_score': auc_score,
                'best_params': grid_search.best_params_
            }

            print(f"     Accuracy: {accuracy:.4f}, AUC: {auc_score:.4f}")

            if grid_search.best_score_ > self.best_score:
                self.best_score = grid_search.best_score_
                self.best_model = model_for_eval
                self.best_model_name = name

        self.results = results
        self.X_test = X_test
        self.y_test = y_test

        print(f"\n🏆 Best model: {self.best_model_name} (Accuracy: {self.best_score:.4f})")
        return self
    
    def evaluate_best_model(self):
        """Detailed evaluation of the best model"""
        print(f"\n📈 Detailed evaluation of {self.best_model_name}:")
        
        # Predictions
        y_pred = self.best_model.predict(self.X_test)
        y_pred_proba = self.best_model.predict_proba(self.X_test)[:, 1]
        
        # Metrics
        accuracy = accuracy_score(self.y_test, y_pred)
        auc_score = roc_auc_score(self.y_test, y_pred_proba)
        
        print(f"Accuracy: {accuracy:.4f}")
        print(f"AUC Score: {auc_score:.4f}")
        
        print("\nClassification Report:")
        print(classification_report(self.y_test, y_pred))
        
        print("\nConfusion Matrix:")
        print(confusion_matrix(self.y_test, y_pred))
        
        # Feature importance (if available)
        # Use .best_estimator_ to access the pipeline inside GridSearchCV
        if hasattr(self.best_model.best_estimator_.named_steps['classifier'], 'feature_importances_'):
            self.analyze_feature_importance()
        
        return self
    
    def analyze_feature_importance(self):
        """Analyze feature importance for tree-based models"""
        print("\n🔍 Feature Importance Analysis:")
        
        # Get feature names after preprocessing
        feature_names = []
        
        # Numerical features
        feature_names.extend(self.numerical_cols)
        
        # Categorical features (after one-hot encoding)
        if self.categorical_cols:
            cat_transformer = self.best_model.best_estimator_.named_steps['preprocessor'].named_transformers_['cat']
            cat_feature_names = cat_transformer.get_feature_names_out(self.categorical_cols)
            feature_names.extend(cat_feature_names)
        
        # Get feature importances
        importances = self.best_model.best_estimator_.named_steps['classifier'].feature_importances_
        
        # Create feature importance dataframe
        feature_importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False)
        
        print("Top 10 Most Important Features:")
        print(feature_importance_df.head(10).to_string(index=False))
        
        return feature_importance_df
    
    def save_model(self, model_dir='../backend/model'):
        """Save the best model and metadata"""
        print(f"\n💾 Saving model to {model_dir}...")
        
        # Ensure directory exists
        os.makedirs(model_dir, exist_ok=True)
        
        # Save the model
        model_path = os.path.join(model_dir, 'student_model.joblib')
        joblib.dump(self.best_model, model_path)
        
        # Save metadata
        metadata = {
            'model_name': self.best_model_name,
            'accuracy': self.best_score,
            'features': list(self.X.columns),
            'categorical_cols': self.categorical_cols,
            'numerical_cols': self.numerical_cols,
            'best_params': self.results[self.best_model_name]['best_params']
        }
        
        metadata_path = os.path.join(model_dir, 'model_metadata.joblib')
        joblib.dump(metadata, metadata_path)
        
        print(f"✅ Model saved successfully!")
        print(f"   - Model: {model_path}")
        print(f"   - Metadata: {metadata_path}")
        
        return self
    
    def run_full_pipeline(self, target='pass'):
        """Run the complete training pipeline"""
        print("🎯 Starting Enhanced Student Performance Model Training")
        print("=" * 60)
        
        self.load_and_prepare_data()
        self.select_features(target=target)
        self.create_preprocessor()
        self.train_multiple_models()
        self.evaluate_best_model()
        self.save_model()
        
        print("\n" + "=" * 60)
        print("🎉 Training pipeline completed successfully!")
        
        return self

    def explain_prediction(self, index=0):
        """
        Use SHAP to explain a single prediction from the test set.
        Example: trainer.explain_prediction(index=0)
        """
        print(f"\n🔎 SHAP Explanation for test sample {index}:")
        # Get the classifier from the best pipeline
        classifier = self.best_model.best_estimator_.named_steps['classifier']
        # Get the preprocessed test data
        preprocessor = self.best_model.best_estimator_.named_steps['preprocessor']
        X_test_transformed = preprocessor.transform(self.X_test)
        # Use TreeExplainer for tree-based models, KernelExplainer otherwise
        if hasattr(classifier, "predict_proba") and hasattr(classifier, "feature_importances_"):
            explainer = shap.TreeExplainer(classifier)
        else:
            explainer = shap.Explainer(classifier, X_test_transformed)
        shap_values = explainer(X_test_transformed)
        shap.plots.waterfall(shap_values[index])

    # Example threshold logic for API usage:
    @staticmethod
    def classify_pass_probability(pass_probability):
        """
        Classify pass/fail/borderline based on probability.
        """
        if pass_probability >= 0.6:
            return "Pass"
        elif pass_probability >= 0.4:
            return "Borderline"
        else:
            return "Fail"

# Usage
if __name__ == "__main__":
    # Initialize and run the trainer
    trainer = EnhancedStudentModelTrainer(data_path='../dataset/processed_student_training_data.csv')
    trainer.run_full_pipeline()

    
    # Optional: Train model for different target (good grades)
    print("\n" + "="*60)
    print("🎯 Training model for 'Good Grades' prediction (14+)")
    trainer_good = EnhancedStudentModelTrainer(data_path='../dataset/processed_student_training_data.csv')
    trainer_good.run_full_pipeline(target='good_grade')
