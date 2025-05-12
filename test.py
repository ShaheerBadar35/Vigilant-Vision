# import os
# import numpy as np
# import cv2
# from flask import Flask, request, jsonify
# from werkzeug.utils import secure_filename
# from tensorflow.keras.models import load_model
# from tensorflow.keras.layers import DepthwiseConv2D
# from tensorflow.keras.saving import register_keras_serializable

# # Create a custom wrapper for DepthwiseConv2D to handle the groups parameter
# @register_keras_serializable()
# class CustomDepthwiseConv2D(DepthwiseConv2D):
#     def __init__(self, *args, **kwargs):
#         # Remove the 'groups' parameter if present
#         kwargs.pop('groups', None)
#         super().__init__(*args, **kwargs)

# # Then modify your model loading code:
# custom_objects = {'DepthwiseConv2D': CustomDepthwiseConv2D}
# model = load_model('modelnew.h5', custom_objects=custom_objects)


# # Initialize Flask app
# app = Flask(__name__)

# # Load your trained model
# CLASSES = ["NonViolence", "Violence"]

# # Configuration
# UPLOAD_FOLDER = 'test'
# ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}
# app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# # Create upload folder if not exists
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# def allowed_file(filename):
#     return '.' in filename and \
#            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# def preprocess_frame(frame):
#     """Match training preprocessing exactly"""
#     # Convert BGR to RGB (as done in training)
#     rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
#     # Resize to match training input size
#     resized_frame = cv2.resize(rgb_frame, (128, 128))  # Match your IMG_SIZE
    
#     # Apply normalization IF used during training
#     # (Your training code doesn't show normalization, so you might need to remove this)
#     # normalized_frame = resized_frame / 255.0
    
#     # Add batch dimension
#     final_frame = np.expand_dims(resized_frame, axis=0)  # Keep this if using TF/Keras
    
#     return final_frame

# def predict_video(video_path):
#     cap = cv2.VideoCapture(video_path)
#     predictions = []
    
#     while cap.isOpened():
#         ret, frame = cap.read()
#         if not ret:
#             break
            
#         # Apply EXACT training preprocessing
#         processed_frame = preprocess_frame(frame)
        
#         # Make prediction
#         pred = model.predict(processed_frame)
#         predictions.append(pred[0][1])
    
#     cap.release()
#     avg_prob = np.mean(predictions) if predictions else 0.0
#     return avg_prob

# @app.route('/predict', methods=['POST'])
# def predict():
#     """Endpoint for video violence detection"""
#     if 'file' not in request.files:
#         return jsonify({'error': 'No file uploaded'}), 400
        
#     file = request.files['file']
#     if file.filename == '':
#         return jsonify({'error': 'No file selected'}), 400
        
#     if file and allowed_file(file.filename):
#         filename = secure_filename(file.filename)
#         file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#         file.save(file_path)
        
#         # Get prediction
#         violence_prob = predict_video(file_path)
        
#         # Clean up uploaded file
#         os.remove(file_path)
        
#         # Determine final class
#         threshold = 0.5  # Adjust this threshold as needed
#         prediction = CLASSES[1] if violence_prob >= threshold else CLASSES[0]
        
#         return jsonify({
#             'prediction': prediction,
#             'violence_probability': float(violence_prob),
#             'message': 'Success'
#         })
    
#     return jsonify({'error': 'Invalid file format'}), 400

# if __name__ == '__main__':
#     app.run(debug=True, host='0.0.0.0', port=5000)


import os
import numpy as np
import cv2
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import DepthwiseConv2D
from tensorflow.keras.saving import register_keras_serializable

# Create a custom wrapper for DepthwiseConv2D to handle the groups parameter
@register_keras_serializable()
class CustomDepthwiseConv2D(DepthwiseConv2D):
    def __init__(self, *args, **kwargs):
        # Remove the 'groups' parameter if present
        kwargs.pop('groups', None)
        super().__init__(*args, **kwargs)

# Then modify your model loading code:
custom_objects = {'DepthwiseConv2D': CustomDepthwiseConv2D}
model = load_model('modelnew.h5', custom_objects=custom_objects)

# Initialize Flask app
app = Flask(__name__)

# Load your trained model
CLASSES = ["NonViolence", "Violence"]

# Configuration
UPLOAD_FOLDER = 'test'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create upload folder if not exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_frame(frame):
    """Match training preprocessing exactly"""
    # Convert BGR to RGB (as done in training)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Resize to match training input size
    resized_frame = cv2.resize(rgb_frame, (128, 128))  # Match your IMG_SIZE
    
    # Apply normalization (as done in your Colab code)
    normalized_frame = resized_frame / 255.0
    
    # Add batch dimension
    final_frame = np.expand_dims(normalized_frame, axis=0)  # Shape (1, 128, 128, 3)
    
    return final_frame

def predict_video(video_path):
    cap = cv2.VideoCapture(video_path)
    predictions = []
    
    if not cap.isOpened():
        print(f"Error opening video file: {video_path}")
        return 0.0, 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Apply preprocessing (matches your Colab code)
        processed_frame = preprocess_frame(frame)
        
        # Make prediction (verbose=0 to suppress output)
        pred = model.predict(processed_frame, verbose=0)
        
        # Get the single probability value (model outputs direct probability)
        violence_prob = float(pred[0])  # Changed from pred[0][1] to pred[0]
        print(f"Frame violence probability: {violence_prob:.4f}")
        predictions.append(violence_prob)
    
    cap.release()
    
    if not predictions:
        print("Warning: No frames processed successfully")
        return 0.0, 0
        
    avg_prob = np.max(predictions)
    print(f"Processed {len(predictions)} frames. Avg violence prob: {avg_prob:.4f}")
    return avg_prob, len(predictions)

@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint for video violence detection"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Get prediction and frame count
        violence_prob, frames_processed = predict_video(file_path)
        
        # Clean up uploaded file
        os.remove(file_path)
        
        # Determine final class
        threshold = 0.6  # Adjust this threshold as needed
        prediction = CLASSES[1] if violence_prob >= threshold else CLASSES[0]
        
        return jsonify({
            'prediction': prediction,
            'violence_probability': float(violence_prob),
            'message': 'Success',
            'frames_processed': frames_processed
        })
    
    return jsonify({'error': 'Invalid file format'}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)