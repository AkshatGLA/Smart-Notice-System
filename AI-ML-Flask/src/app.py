# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import torch
# from transformers import AutoTokenizer, AutoModelForSequenceClassification
# import joblib
# import os
# from pathlib import Path

# app = Flask(__name__)
# CORS(app)

# # Load model components
# MODEL_DIR = Path(r"C:\Users\Aryan\OneDrive\Desktop\2025\MajorProjecst\Jovac\Smart-Notice-Agent\AI-ML-Flask\src\models")

# class NoticeClassifier:
#     def __init__(self):
#         self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
#         self.tokenizer = None
#         self.model = None
#         self.label_encoder = None
#         self.class_names = []
        
#         try:
#             # Load tokenizer
#             self.tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR / "tokenizer"))
            
#             # Load model
#             self.model = AutoModelForSequenceClassification.from_pretrained(
#                 str(MODEL_DIR / "model"),
#                 local_files_only=True
#             ).to(self.device)
            
#             # Load label encoder
#             self.label_encoder = joblib.load(MODEL_DIR / "label_encoder.joblib")
            
#             # Load class names
#             with open(MODEL_DIR / "class_names.txt", "r") as f:
#                 self.class_names = [line.strip() for line in f]
                
#             print("✅ Model loaded successfully")
#         except Exception as e:
#             print(f"❌ Failed to load model: {str(e)}")
#             raise

#     def predict(self, text):
#         inputs = self.tokenizer(
#             text,
#             truncation=True,
#             padding='max_length',
#             max_length=512,
#             return_tensors='pt'
#         ).to(self.device)

#         with torch.no_grad():
#             outputs = self.model(**inputs)
#             probs = torch.nn.functional.softmax(outputs.logits, dim=1)
#             conf, preds = torch.max(probs, dim=1)
        
#         return {
#             "category": self.class_names[preds.item()],
#             "confidence": float(conf.item()),
#             "all_categories": [
#                 {"label": label, "score": float(score)}
#                 for label, score in zip(self.class_names, probs[0].tolist())
#             ]
#         }

# # Initialize classifier
# try:
#     classifier = NoticeClassifier()
# except Exception as e:
#     print(f"Failed to initialize classifier: {e}")
#     classifier = None

# @app.route("/classify", methods=["POST"])
# def classify_notice():
#     if not classifier:
#         return jsonify({"error": "Model not loaded"}), 500
    
#     try:
#         data = request.get_json()
#         text = data.get("text", "").strip()
        
#         if not text:
#             return jsonify({"error": "Text cannot be empty"}), 400
            
#         if len(text) > 10000:
#             return jsonify({"error": "Text too long (max 10,000 characters)"}), 400
            
#         result = classifier.predict(text)
#         return jsonify(result)
        
#     except Exception as e:
#         return jsonify({"error": "Classification failed", "details": str(e)}), 500

# @app.route("/health", methods=["GET"])
# def health_check():
#     status = {
#         "ready": classifier is not None,
#         "device": str(classifier.device) if classifier else None,
#         "categories": classifier.class_names if classifier else []
#     }
#     return jsonify(status)

# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5000, debug=True)













import torch
from flask import Flask, request, jsonify
from transformers import BertTokenizer, BertForSequenceClassification
import joblib
import re
import os

app = Flask(__name__)

class NoticeClassifier:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Load tokenizer
        self.tokenizer = BertTokenizer.from_pretrained('model_tokenizer')
        
        # Load label encoder
        self.label_encoder = joblib.load('label_encoder.joblib')
        self.class_names = list(self.label_encoder.classes_)
        
        # Initialize model with correct architecture
        self.model = BertForSequenceClassification.from_pretrained(
            "bert-base-uncased",
            num_labels=len(self.class_names),
            ignore_mismatched_sizes=True
        )
        
        # Load trained weights
        self.model.load_state_dict(
            torch.load('notice_classifier_model.pt', map_location=self.device)
        )
        self.model.to(self.device)
        self.model.eval()
    
    def clean_text(self, text):
        text = re.sub(r'\n+', '\n', text)
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s.,!?\-]', '', text)
        return text.strip()
    
    def predict(self, text, top_k=3):
        text = self.clean_text(text)
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=1)
        
        top_probs, top_indices = torch.topk(probs, k=top_k)
        results = []
        for i in range(top_k):
            label = self.class_names[top_indices[0][i].item()]
            prob = top_probs[0][i].item()
            results.append({"label": label, "confidence": round(prob, 4)})
        
        return results

# Initialize classifier
classifier = NoticeClassifier()

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        predictions = classifier.predict(text)
        return jsonify({"predictions": predictions})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)