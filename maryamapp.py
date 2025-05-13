import os
import cv2
import sqlite3
import tensorflow as tf
from tensorflow.keras.models import load_model
from flask import Flask, request, jsonify, render_template, send_file, Response,url_for,send_from_directory,redirect
from datetime import datetime
from ultralytics import YOLO
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask_cors import CORS
import base64
from datetime import datetime, timedelta
#import firebase_admin
#from firebase_admin import credentials, firestore
import time


#----- Initialize Flask app -----
app = Flask(__name__)
CORS(app)

#----- Global flag to control live feed -----
global is_live_feed_running
is_live_feed_running = {"feed1": False, "feed2": False}

#----- Loading pre trained models -----
CROWD_MODEL = tf.saved_model.load('CC-Model/model')
MASK_MODEL = YOLO("Mask-Model/best.pt")
QUEUE_MODEL = YOLO("Queue-Model/best.pt")
SMOKE_MODEL = YOLO("Smoke-Model/best.pt")
SUSSY_MODEL = load_model('Sussy-Model/best3.h5')
SUSSY_LABELS = ["Abuse", "Arson", "Arrest", "Explosion", "Fighting", "Robbery", "Shooting"]
Mask_names = MASK_MODEL.model.names
Queue_names = QUEUE_MODEL.model.names
Smoke_name = SMOKE_MODEL.model.names

# Create directories for uploaded and processed videos
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER


# Initialize Firebase (replace 'path/to/serviceAccountKey.json' with your credentials)
#cred = credentials.Certificate('credentials.json')
#firebase_admin.initialize_app(cred)

# Get Firestore client
#db = firestore.client()

#CREATE FIRESTORE ALERTS TABLE
# def add_alert_to_firestore(camera_id, location_name, alert_type, detected_value, timestamp,status="pending",action):
#     alert_ref = db.collection('alerts').document()  # Auto-generate document ID
#     alert_ref.set({
#         'camera_id': camera_id,
#         'location_name': location_name,
#         'alert_type': alert_type,
#         'detected_value': detected_value,
#         'timestamp': timestamp,
#         'status':status,
#         'action': action
#     })


#----- Cache initialization for tracking ids -----
recent_detections_cache = {
    'mask': set(),
    'queue': set(),
    'smoke': set(),
    'crowd': set(),
    'anamoly': set()
}

#----- SQLite database initialization -----
DB_NAME = 'VV.db'

def initialize_database():

    """Initializing SQLite database and creating tables."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS CrowdControl (
            Detection_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Camera_ID TEXT NOT NULL,
            No_of_Detections INTEGER NOT NULL,
            Timestamp TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Mask_Detection (
            Detection_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Camera_ID TEXT NOT NULL,
            No_of_Detections INTEGER NOT NULL,
            Timestamp TEXT NOT NULL,
            Image BLOB      
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Queue_Detection (
            Detection_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Camera_ID TEXT NOT NULL,
            No_of_Detections INTEGER NOT NULL,
            Timestamp TEXT NOT NULL,
            Image BLOB      
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Smoking_Detection (
            Detection_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Camera_ID TEXT NOT NULL,
            No_of_Detections INTEGER NOT NULL,
            Timestamp TEXT NOT NULL,
            Image BLOB      
        )
    ''')  
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Camera (
            Camera_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            IP_Address TEXT NOT NULL,
            Location_ID INTEGER NOT NULL,
            FOREIGN KEY (Location_ID) REFERENCES Location(Location_ID)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Location (
            Location_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Location_Name TEXT NOT NULL UNIQUE
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Alerts (
            Alert_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Camera_ID INTEGER,
            Location_Name TEXT NOT NULL,
            Alert_Type TEXT NOT NULL,
            Detected_Value INTEGER,
            Action TEXT NOT NULL,
            Timestamp TEXT NOT NULL,
            Status TEXT,
            Image BLOB      
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS anamoly_Detection (
            Detection_ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Camera_ID TEXT NOT NULL,
            No_of_Detections INTEGER NOT NULL,
            Timestamp TEXT NOT NULL,
            Image BLOB,
            Activity_Type TEXT      
        )
    ''')    
    conn.commit()
    conn.close()

#----- Logging alerts in db -----
def log_alert(location_name, alert_type, action, timestamp, camera_id=None, detected_value=None, image=None, status="pending"):

    # storing to firebase
    #add_alert_to_firestore(camera_id,location_name,alert_type,detected_value,status,action,timestamp)

    # storing in sqlite as well to reduce API Hits
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO Alerts (Camera_ID, Location_Name, Alert_Type, Detected_Value, Action, Timestamp, Status, Image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (camera_id, location_name, alert_type, detected_value, action, timestamp, status, image))
    conn.commit()
    conn.close()

#----- Logging detections/data in db -----
def log_detection_to_db(camera_id, model_type, no_of_detections, image_data=None,activity=None):

    conn = sqlite3.connect('VV.db')
    cursor = conn.cursor()
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    print("INSIDE LOG DETECTION DB")

    if model_type == "Crowd":
        print("Crowd Data logged in DB")
        cursor.execute('''INSERT INTO CrowdControl (Camera_ID, No_of_Detections, Timestamp ) VALUES (?, ?, ?)''',
                       (camera_id, no_of_detections, timestamp ))
    elif model_type == "mask":
        print("Mask Data logged in DB")
        cursor.execute('''INSERT INTO Mask_Detection (Camera_ID, No_of_Detections, Timestamp, Image) VALUES (?, ?, ?, ?)''',
                       (camera_id, no_of_detections, timestamp, image_data))
    elif model_type == "queue":
        print("QUEUE Data logged in DB")
        cursor.execute('''INSERT INTO Queue_Detection (Camera_ID, No_of_Detections, Timestamp, Image) VALUES (?, ?, ?, ?)''',
                       (camera_id, no_of_detections, timestamp, image_data))
    elif model_type == "smoke":
        print("Smoke Data logged in DB")
        cursor.execute('''INSERT INTO Smoking_Detection (Camera_ID, No_of_Detections, Timestamp, Image) VALUES (?, ?, ?, ?)''',
                       (camera_id, no_of_detections, timestamp, image_data))
    elif model_type == "anamoly":
        print("anamoly Data logged in DB")
        cursor.execute('''INSERT INTO anamoly_Detection (Camera_ID, No_of_Detections, Timestamp, Image, Activity_Type) VALUES (?, ?, ?, ?, ?)''',
                       (camera_id, no_of_detections, timestamp, image_data,activity))
    
    conn.commit()
    conn.close()

#----- Initialize the database -----
initialize_database()

#----- CrowdCount Model processing function -----
def CC_process_video_alternative(video_path, model, output_path, conf_threshold=0.25, frame_skip=10, detection_threshold=20, cooldown_seconds=90, count_change_threshold=3,location_name = "MainHall"):
    
    """Efficient frame-by-frame video processing, skipping frames periodically, with people detection."""
    print("CC UPLOAD VIDEO CALLED")
    
    cap = cv2.VideoCapture(video_path)
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    out = cv2.VideoWriter(output_path, cv2.VideoWriter_fourcc(*'mp4v'), fps, (frame_width, frame_height))

    print(f"Processing video: {video_path}")
    print(f"Total frames: {total_frames}, Resolution: {frame_width}x{frame_height}, FPS: {fps}")

    frame_count = 0
    processed_frame_count = 0
    total_people_detected = 0
    last_crowd_alert_time = 0
    last_crowd_count = 0
    last_threshold_check_time = 0

    camera_id = os.path.basename(video_path)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # skiping frames to reduce computation
        if frame_count % frame_skip != 0:
            frame_count += 1
            continue

        frame_count += 1
        processed_frame_count += 1

        # converting BGR frame (OpenCV) to RGB for TensorFlow
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        input_tensor = tf.convert_to_tensor(rgb_frame, dtype=tf.uint8)[tf.newaxis, ...]

        # detecting objects
        results = model(input_tensor)

        # bounding boxes for detections
        boxes = results['detection_boxes'].numpy()[0]
        classes = results['detection_classes'].numpy()[0]
        scores = results['detection_scores'].numpy()[0]

        frame_people_detected = 0

        # counting number of people detected in this frame
        for i in range(int(results['num_detections'][0])):
            if classes[i] == 1 and scores[i] > conf_threshold:
                ymin, xmin, ymax, xmax = boxes[i]
                left, top, right, bottom = (int(xmin * frame_width), int(ymin * frame_height),
                                            int(xmax * frame_width), int(ymax * frame_height))
                cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
                frame_people_detected += 1

        total_people_detected += frame_people_detected

        # alerts cooldown logic for logging in db
        current_time = time.time()
        time_since_last_alert = current_time - last_crowd_alert_time
        count_difference = abs(frame_people_detected - last_crowd_count)
        time_since_last_threshold = current_time - last_threshold_check_time

        print("Total people detected in current frame: ",frame_people_detected)
        # 1-If the detection threshold is exceeded
        if frame_people_detected >= detection_threshold:
            print("Inside if, total ppl in this frame :",frame_people_detected)
            log_detection_to_db(camera_id,"Crowd", frame_people_detected)
            

            # alert cooldown using 2-timer and 3-state
            if time_since_last_alert > cooldown_seconds:
                if count_difference >=count_change_threshold and frame_people_detected > last_crowd_count:
                    
                    last_crowd_alert_time = time.time()
                    last_crowd_count = frame_people_detected

                      
                    action = "Overcrowding! Guide attendees to other Location"
                    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    log_alert(location_name, "Crowd", action, timestamp, camera_id, frame_people_detected)

        # resets after situation is normalized     
        else:
            if time_since_last_threshold > 180:
                last_crowd_count = 0
                last_threshold_check_time = time.time()


        # Write processed frame to output video
        out.write(frame)

    cap.release()
    out.release()
    print(f"Video processing completed. Output saved at: {output_path}")
    print(f"Total people detected: {total_people_detected}")
    return total_people_detected


frame_count = 0  # Global counter for frame skipping
last_crowd_alert_time = 0 # Global counter to check time of last crowd alert generation
last_crowd_count = 0 # Global counter for last crowd count value
last_threshold_check_time = 0 # Global counter for checking if situation is normal

def CC_process_webcam_feed(frame, model, conf_threshold=0.25, frame_skip=10, detection_threshold=37, cooldown_seconds=90, count_change_threshold=3,location_name = "Webcam Location"):
   
    """Process a single frame for people detection."""
    print("Processing frame for crowd detection...")
    print("Detection Threshold Received: ",detection_threshold)
    print("Confidence Threshold: ",conf_threshold)
    
    total_people_detected_in_frame = 0
    
    # skiping frames to reduce computation
    if frame_count % frame_skip != 0:
        frame_count += 1
        return "crowd", 0  

    frame_count += 1

    # converting BGR frame (OpenCV) to RGB for TensorFlow
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    input_tensor = tf.convert_to_tensor(rgb_frame, dtype=tf.uint8)[tf.newaxis, ...]

    # detecting objects
    results = model(input_tensor)

    # bounding boxes for detections
    boxes = results['detection_boxes'].numpy()[0]
    classes = results['detection_classes'].numpy()[0]
    scores = results['detection_scores'].numpy()[0]

    # counting number of people detected in this frame
    print("total detects: ",int(results['num_detections'][0]))
    for i in range(int(results['num_detections'][0])):
        if classes[i] == 1 and scores[i] > conf_threshold:
            total_people_detected_in_frame += 1

    print(f"Total people detected in current frame: {total_people_detected_in_frame}")

    # bounding boxes for detections
    for i in range(int(results['num_detections'][0])):
        if classes[i] == 1 and scores[i] > conf_threshold:
            ymin, xmin, ymax, xmax = boxes[i]
            left, top, right, bottom = (
                int(xmin * frame.shape[1]),
                int(ymin * frame.shape[0]),
                int(xmax * frame.shape[1]),
                int(ymax * frame.shape[0]),
            )
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)

    # Display the processed frame
    #cv2.imshow('Webcam Feed', frame)

    # alerts cooldown logic for logging in db

    current_time = time.time()
    time_since_last_alert = current_time - last_crowd_alert_time
    count_difference = abs(total_people_detected_in_frame - last_crowd_count)
    time_since_last_threshold = current_time - last_threshold_check_time

    # 1-If the detection threshold is exceeded
    if total_people_detected_in_frame >= detection_threshold:
        log_detection_to_db("Webcam","Crowd", total_people_detected_in_frame)
        
        # alert cooldown using 2-timer and 3-state
        if time_since_last_alert > cooldown_seconds:
            if count_difference >=count_change_threshold and total_people_detected_in_frame > last_crowd_count:
                    
                last_crowd_alert_time = time.time()
                last_crowd_count = total_people_detected_in_frame

                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                action = "Overcrowding! Guide attendees to other Location"
                  # Replace with dynamic location
                log_alert(location_name, "Crowd", action, timestamp, "Webcam", total_people_detected_in_frame)

        # resets after situation is normalized     
    else:
        if time_since_last_threshold > 180:
            last_crowd_count = 0
            last_threshold_check_time = time.time()

    return "crowd", total_people_detected_in_frame

last_mask_alert_time = 0
#MASK MODEL FUNCTIONS
def MASK_detect_objects_from_webcam(frame, model, cooldown_seconds = 0,location_name = "Webcam Location",mask_mode="without_mask"):
    """Process a single frame for mask-wearing detection without duplicate logging."""
    print("MASK OBJECTS FROM WEB")
    no_mask_detections = 0

    frame = cv2.resize(frame, (1020, 600))  # Resize the frame

    results = model.track(frame, persist=True)
    if results[0].boxes is not None and results[0].boxes.id is not None:
        boxes = results[0].boxes.xyxy.int().cpu().tolist()
        class_ids = results[0].boxes.cls.int().cpu().tolist()
        track_ids = results[0].boxes.id.int().cpu().tolist()

        for box, class_id, track_id in zip(boxes, class_ids, track_ids):
            label = Mask_names[class_id]
            x1, y1, x2, y2 = box
            color = (0, 255, 0) if label.lower() not in [mask_mode, "mask_weared_incorrect"] else (0, 0, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f'{track_id} - {label}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

            current_time = time.time()
            # Check and log detection
            if label.lower() in ["without_mask", "mask_weared_incorrect"]:
                if track_id not in recent_detections_cache['mask']:
                    recent_detections_cache['mask'].add(track_id)
                    no_mask_detections += 1

                    _, image_buffer = cv2.imencode('.jpg', frame)
                    image_data = image_buffer.tobytes()
                    log_detection_to_db("Webcam", "mask", no_mask_detections, image_data)

                    if (current_time - last_mask_alert_time) > cooldown_seconds:

                        last_mask_alert_time = time.time()
                        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        action = "Take action against attendees with no mask"
                        log_alert(location_name, "No-Mask", action, timestamp, "Webcam", no_mask_detections)

    return no_mask_detections


def MASK_process_video_for_detections(video_path,model, cooldown_seconds= 0,location_name = "MainHall",mask_mode="without_mask"):
    print("MASK UPLOAD CALLED")
    """Process a video for mask detections and save snapshots to the database."""
    cap = cv2.VideoCapture(video_path)
    count = 0
    last_alert_time = 0
    no_mask_detections = 0
    camera_id = os.path.basename(video_path)  # Use the video filename as the camera ID

    # Output video setup
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Codec
    output_path = f"output_videos/{camera_id}_mask_annotated.mp4"
    os.makedirs("output_videos", exist_ok=True)  # Create folder if not exists
    out = cv2.VideoWriter(output_path, fourcc, 15.0, (1020, 600))  # (fps, frame size)

    # Cache to store track IDs of recently detected "No Queue" persons
    recent_detections = set()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        count += 1
        if count % 2 != 0:
            continue

        # Resize the frame to (1020, 600)
        frame = cv2.resize(frame, (1020, 600))

        # Run YOLOv8 tracking on the frame
        results = model.track(frame, persist=True)

        if results[0].boxes is not None and results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.int().cpu().tolist()
            class_ids = results[0].boxes.cls.int().cpu().tolist()
            track_ids = results[0].boxes.id.int().cpu().tolist()

            for box, class_id, track_id in zip(boxes, class_ids, track_ids):
                label = Mask_names[class_id]
                x1, y1, x2, y2 = box

                # Draw bounding box and label on the frame
                color = (0, 255, 0) if label.lower() not in [mask_mode, "mask_weared_incorrect"] else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f'{track_id} - {label}', (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

                current_time = time.time()
                # Check for "No Queue" class (Assume class 1 = "No Queue")
                if label.lower() in ["without_mask", "mask_weared_incorrect"] and track_id not in recent_detections:
                    recent_detections.add(track_id)  # Add to cache
                    no_mask_detections += 1

                    # Save the frame with bounding boxes as an image
                    _, image_buffer = cv2.imencode('.jpg', frame)
                    image_data = image_buffer.tobytes()

                    # Log detection to the database
                    log_detection_to_db(camera_id, "mask", 1, image_data)

                    if (current_time - last_alert_time) > cooldown_seconds:

                        last_alert_time = time.time()
                        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        action = "Take action against attendees with no mask"
                          # Replace with dynamic location
                        log_alert(location_name, "No-Mask", action, timestamp, "Webcam", 1)

        # Write annotated frame to output video
        out.write(frame)

    cap.release()
    out.release()
    print(f"✅ Saved output video to: {output_path}")

last_queue_alert_time = 0
#QUEUE MODEL FUNCTIONS 
def QUEUE_detect_objects_from_webcam(frame, model, cooldown_seconds= 0,location_name = "Webcam Location"):
    """Process a single frame for queue detection without duplicate logging."""
    print("QUEUE OBJECT FROM WEB")
    no_queue_detections = 0
    frame = cv2.resize(frame, (1020, 600))

    results = model.track(frame, persist=True)
    if results[0].boxes is not None and results[0].boxes.id is not None:
        boxes = results[0].boxes.xyxy.int().cpu().tolist()
        class_ids = results[0].boxes.cls.int().cpu().tolist()
        track_ids = results[0].boxes.id.int().cpu().tolist()

        for box, class_id, track_id in zip(boxes, class_ids, track_ids):
            label = Queue_names[class_id]
            x1, y1, x2, y2 = box
            color = (0, 255, 0) if label.lower() != "no-queue" else (0, 0, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f'{track_id} - {label}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

            current_time = time.time()

            # Check and log detection
            if label.lower() == "no-queue":
                if track_id not in recent_detections_cache['queue']:
                    recent_detections_cache['queue'].add(track_id)
                    no_queue_detections += 1

                    _, image_buffer = cv2.imencode('.jpg', frame)
                    image_data = image_buffer.tobytes()
                    log_detection_to_db("Webcam", "queue", no_queue_detections, image_data)

                    if (current_time - last_queue_alert_time) > cooldown_seconds:

                        last_queue_alert_time = time.time()
                        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        action = "Ensure attendees form queue"
                        log_alert(location_name, "No-Queue", action, timestamp, "Webcam", no_queue_detections)                 

    return no_queue_detections

def QUEUE_process_video_for_detections(video_path, model, cooldown_seconds=0,location_name = "MainHall"):
    """Process a video for no queue detections and save snapshots to the database."""
    print("QUEUE UPLOAD VIDEO Called")
    cap = cv2.VideoCapture(video_path)
    count = 0
    camera_id = os.path.basename(video_path)  # Use the video filename as the camera ID

    # Output video setup
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Codec
    output_path = f"output_videos/{camera_id}_queue_annotated.mp4"
    os.makedirs("output_videos", exist_ok=True)  # Create folder if not exists
    out = cv2.VideoWriter(output_path, fourcc, 15.0, (1020, 600))  # (fps, frame size)


    # Cache to store track IDs of recently detected "No Queue" persons
    recent_detections = set()
    last_alert_time = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        count += 1
        if count % 2 != 0:
            continue

        # Resize the frame to (1020, 600)
        frame = cv2.resize(frame, (1020, 600))

        # Run YOLOv8 tracking on the frame
        results = model.track(frame, persist=True)

        if results[0].boxes is not None and results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.int().cpu().tolist()
            class_ids = results[0].boxes.cls.int().cpu().tolist()
            track_ids = results[0].boxes.id.int().cpu().tolist()

            for box, class_id, track_id in zip(boxes, class_ids, track_ids):
                label = Queue_names[class_id]
                x1, y1, x2, y2 = box

                # Draw bounding box and label on the frame
                color = (0, 255, 0) if label.lower() != "no-queue" else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f'{track_id} - {label}', (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                
                current_time = time.time()
                # Check for "No Queue" class (Assume class 1 = "No Queue")
                if label.lower() == "no-queue" and track_id not in recent_detections:
                    recent_detections.add(track_id)  # Add to cache

                    # Save the frame with bounding boxes as an image
                    _, image_buffer = cv2.imencode('.jpg', frame)
                    image_data = image_buffer.tobytes()

                    # Log detection to the database
                    print("LOG DETECTION TO DB OF QUEUE SHOULD BE CALLED")
                    log_detection_to_db(camera_id,"queue", 1, image_data)

                    if (current_time - last_alert_time) > cooldown_seconds:
                        
                        last_alert_time = time.time()
                        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        action = "Ensure attendees form queue"
                        log_alert(location_name, "No-Queue", action, timestamp, "Webcam", 1)

        # Write annotated frame to output video
        out.write(frame)

    cap.release()
    out.release()
    print(f"✅ Saved output video to: {output_path}")

last_smoke_alert_time = 0

#SMOKE MODEL FUNCTIONS
def SMOKE_detect_objects_from_webcam(frame, model, cooldown_seconds = 0,location_name = "Webcam Location"):
    """Process a single frame for smoke detection without duplicate logging."""
    print("SMOKE OBJECTS FROM WEB")
    smoke_detections = 0
    frame = cv2.resize(frame, (1020, 600))  # Resize the frame

    # Run YOLO model tracking on the frame
    results = model.track(frame, persist=True)
    if results[0].boxes is not None and results[0].boxes.id is not None:
        boxes = results[0].boxes.xyxy.int().cpu().tolist()
        class_ids = results[0].boxes.cls.int().cpu().tolist()
        track_ids = results[0].boxes.id.int().cpu().tolist()

        for box, class_id, track_id in zip(boxes, class_ids, track_ids):
            label = Smoke_name[class_id]
            x1, y1, x2, y2 = box

            # Set color based on detection type
            color = (0, 255, 0) if label.lower() not in ["cigarette", "smoke"] else (0, 0, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f'{track_id} - {label}', (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

            current_time = time.time()

            # Check and log detection
            if label.lower() in ["cigarette", "smoke"]:
                if track_id not in recent_detections_cache['smoke']:
                    recent_detections_cache['smoke'].add(track_id)
                    smoke_detections += 1

                    # Save the frame as an image
                    _, image_buffer = cv2.imencode('.jpg', frame)
                    image_data = image_buffer.tobytes()

                    # Log the detection into the database
                    log_detection_to_db("Webcam", "smoke", smoke_detections, image_data)

                    if (current_time - last_smoke_alert_time) > cooldown_seconds:

                        last_smoke_alert_time = time.time()
                        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        action = "Take action against attendees smoking"
                        log_alert(location_name, "Smoke", action, timestamp, "Webcam", smoke_detections)
            
    return smoke_detections

def SMOKE_process_video_for_detections(video_path,model, cooldown_seconds = 0,location_name = "MainHall"):
    """Process a video for mask detections and save snapshots to the database."""
    cap = cv2.VideoCapture(video_path)
    last_alert_time = 0
    count = 0
    camera_id = os.path.basename(video_path)  # Use the video filename as the camera ID

        # Output video setup
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Codec
    output_path = f"output_videos/{camera_id}_queue_annotated.mp4"
    os.makedirs("output_videos", exist_ok=True)  # Create folder if not exists
    out = cv2.VideoWriter(output_path, fourcc, 15.0, (1020, 600))  # (fps, frame size)

    # Cache to store track IDs of recently detected "No Queue" persons
    recent_detections = set()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        count += 1
        if count % 2 != 0:
            continue

        # Resize the frame to (1020, 600)
        frame = cv2.resize(frame, (1020, 600))

        # Run YOLOv8 tracking on the frame
        results = model.track(frame, persist=True)

        if results[0].boxes is not None and results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.int().cpu().tolist()
            class_ids = results[0].boxes.cls.int().cpu().tolist()
            track_ids = results[0].boxes.id.int().cpu().tolist()

            for box, class_id, track_id in zip(boxes, class_ids, track_ids):
                label = Smoke_name[class_id]
                x1, y1, x2, y2 = box

                # Draw bounding box and label on the frame
                color = (0, 255, 0) if label.lower() not in ["cigarette", "smoke"] else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f'{track_id} - {label}', (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

                current_time = time.time()
                # Check for "No Queue" class (Assume class 1 = "No Queue")
                if label.lower() in ["cigarette", "smoke"] and track_id not in recent_detections:
                    recent_detections.add(track_id)  # Add to cache

                    # Save the frame with bounding boxes as an image
                    _, image_buffer = cv2.imencode('.jpg', frame)
                    image_data = image_buffer.tobytes()

                    # Log detection to the database
                    log_detection_to_db(camera_id, "smoke", 1, image_data)

                    if (current_time - last_alert_time) > cooldown_seconds:

                        last_alert_time = time.time()
                        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        action = "Take action against attendees smoking"
                        log_alert(location_name, "Smoke", action, timestamp, "Webcam", 1)

        # Write annotated frame to output video
        out.write(frame)

    cap.release()
    out.release()
    print(f"✅ Saved output video to: {output_path}")


# Add to your recent_detections_cache
recent_detections_cache = {
    'mask': set(),
    'queue': set(),
    'smoke': set(),
    'crowd': set(),
    'anamoly': set()  # New entry for suspicious activity tracking
}

last_anamoly_alert_time = 0  

def anamoly_process_video(video_path, output_path, cooldown_seconds=0, location_name="MainHall"):
    """Process video for suspicious activities."""
    print("anamoly UPLOAD VIDEO CALLED")

    cap = cv2.VideoCapture(video_path)
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))

    # Buffer to store frame sequences
    frame_buffer = []
    sequence_length = 15  # Matches model's time dimension
    target_size = (64, 64)  # Matches model's spatial dimensions

    # Prepare output video
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))

    camera_id = os.path.basename(video_path)
    recent_detections = set()

    # Use global for cooldown timestamp
    global last_anamoly_alert_time

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Preprocess frame
        resized_frame = cv2.resize(frame, target_size)
        normalized_frame = resized_frame / 255.0
        frame_buffer.append(normalized_frame)

        # Keep buffer length fixed (sliding window)
        if len(frame_buffer) > sequence_length:
            frame_buffer.pop(0)

        # Only predict when buffer is full
        if len(frame_buffer) == sequence_length:
            # Create input sequence (1, 15, 64, 64, 3)
            input_sequence = np.expand_dims(np.array(frame_buffer), axis=0)

            # Get predictions
            predictions = SUSSY_MODEL.predict(input_sequence, verbose=0)
            predicted_class = np.argmax(predictions[0])
            confidence = np.max(predictions[0])
            label = SUSSY_LABELS[predicted_class]

            current_time = time.time()

            # Process detection
            if confidence > 0.7:
                # Draw on original frame
                cv2.rectangle(frame, (0, 0), (frame_width, frame_height), (0, 0, 255), 3)
                cv2.putText(frame, f"{label} ({confidence:.2f})", (50, 50),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

                # Log detection if not recently seen
                detection_key = f"{label}_{int(current_time)}"
                if detection_key not in recent_detections:
                    recent_detections.add(detection_key)

                    # Save frame as image
                    _, image_buffer = cv2.imencode('.jpg', frame)
                    image_data = image_buffer.tobytes()

                    # Log to database
                    print("Label: ",label)
                    print("confidence: ",confidence)
                    log_detection_to_db(camera_id, "anamoly", 1, image_data,label)

                    # Send alert if cooldown period has passed
                    print("Current time: ",current_time)
                    print("Last anamoly alert time: ",last_anamoly_alert_time)
                    if (current_time - last_anamoly_alert_time) > cooldown_seconds:
                        last_anamoly_alert_time = current_time
                        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        action = f"Suspicious activity detected: {label}"
                        log_alert(location_name, "Suspicious", action, timestamp, camera_id, 1)

        out.write(frame)

    cap.release()
    out.release()
    print(f"anamoly processing complete. Output saved to {output_path}")


# def anamoly_process_video(video_path, output_path, cooldown_seconds=0, location_name="MainHall"):
#     """Process video for suspicious activities."""
#     print("anamoly UPLOAD VIDEO CALLED")
    
#     cap = cv2.VideoCapture(video_path)
#     frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
#     frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
#     fps = int(cap.get(cv2.CAP_PROP_FPS))
    
#     # Buffer to store frame sequences
#     frame_buffer = []
#     sequence_length = 15  # Matches model's time dimension
#     target_size = (64, 64)  # Matches model's spatial dimensions
    
#     # Prepare output video
#     fourcc = cv2.VideoWriter_fourcc(*'mp4v')
#     out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))
    
#     camera_id = os.path.basename(video_path)
#     recent_detections = set()
    
#     while cap.isOpened():
#         ret, frame = cap.read()
#         if not ret:
#             break
            
#         # Preprocess frame
#         resized_frame = cv2.resize(frame, target_size)
#         normalized_frame = resized_frame / 255.0
#         frame_buffer.append(normalized_frame)
        
#         # Process when buffer has enough frames
#         if len(frame_buffer) >= sequence_length:
#             # Create input sequence (1, 15, 64, 64, 3)
#             input_sequence = np.expand_dims(np.array(frame_buffer), axis=0)
            
#             # Get predictions
#             predictions = SUSSY_MODEL.predict(input_sequence)
#             predicted_class = np.argmax(predictions[0])
#             confidence = np.max(predictions[0])
#             label = SUSSY_LABELS[predicted_class]
            
#             current_time = time.time()
            
#             # Process detection (same as before)
#             if confidence > 0.7:
#                 # Draw on original frame
#                 cv2.rectangle(frame, (0, 0), (frame_width, frame_height), (0, 0, 255), 3)
#                 cv2.putText(frame, f"{label} ({confidence:.2f})", (50, 50), 
#                             cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
#                 # Log detection if not recently seen
#                 detection_key = f"{label}_{int(current_time)}"  # Unique key for this detection
#                 if detection_key not in recent_detections_cache['anamoly']:
#                     recent_detections_cache['anamoly'].add(detection_key)
                    
#                     # Save frame as image
#                     _, image_buffer = cv2.imencode('.jpg', frame)
#                     image_data = image_buffer.tobytes()
                    
#                     # Log to database
#                     log_detection_to_db(camera_id, "anamoly", 1, image_data)
                    
#                     # Send alert if cooldown period has passed
#                     if (current_time - last_anamoly_alert_time) > 0:
#                     # if (current_time - last_anamoly_alert_time) > cooldown_seconds:
#                         last_anamoly_alert_time = current_time
#                         timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
#                         action = f"Suspicious activity detected: {label}"
#                         log_alert(location_name, "Suspicious", action, timestamp, camera_id, 1)
                                       
#             # Reset buffer (or use sliding window)
#             frame_buffer = []

#         out.write(frame)
    
#     cap.release()
#     out.release()
#     print(f"anamoly processing complete. Output saved to {output_path}")


def anamoly_process_webcam_feed(frame, cooldown_seconds=0, location_name="Webcam Location"):
    """Process single frame from webcam for suspicious activities."""
    global last_anamoly_alert_time
    
    # Resize frame for model input
    resized_frame = cv2.resize(frame, (224, 224))
    normalized_frame = resized_frame / 255.0
    input_frame = np.expand_dims(normalized_frame, axis=0)
    
    # Get predictions
    predictions = SUSSY_MODEL.predict(input_frame)
    predicted_class = np.argmax(predictions[0])
    confidence = np.max(predictions[0])
    label = SUSSY_LABELS[predicted_class]
    
    current_time = time.time()
    detection_made = False
    
    # Only consider high-confidence detections
    if confidence > 0.7:  # Adjust threshold as needed
        # Draw bounding box and label
        cv2.rectangle(frame, (0, 0), (frame.shape[1], frame.shape[0]), (0, 0, 255), 3)
        cv2.putText(frame, f"{label} ({confidence:.2f})", (50, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        # Log detection if not recently seen
        detection_key = f"{label}_{int(current_time)}"
        if detection_key not in recent_detections_cache['anamoly']:
            recent_detections_cache['anamoly'].add(detection_key)
            detection_made = True
            
            # Save frame as image
            _, image_buffer = cv2.imencode('.jpg', frame)
            image_data = image_buffer.tobytes()
            
            # Log to database
            log_detection_to_db("Webcam", "anamoly", 1, image_data)
            
            # Send alert if cooldown period has passed
            if (current_time - last_anamoly_alert_time) > cooldown_seconds:
                last_anamoly_alert_time = current_time
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                action = f"Suspicious activity detected: {label}"
                log_alert(location_name, "Suspicious", action, timestamp, "Webcam", 1)
    
    return "anamoly", 1 if detection_made else 0


#FLASK ROUTING
@app.route('/')
def index():
    """Render the homepage."""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file1' not in request.files and 'file2' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file1 = request.files.get('file1')
    file2 = request.files.get('file2')
    
    selected_models_file1 = request.form.getlist('models_file1')
    selected_models_file2 = request.form.getlist('models_file2')
    # detection_threshold = int(request.form.get('threshold', 37))
    detection_threshold = user_settings["threshold"]
    cooldown_seconds = user_settings["cooldown"]
    mask_mode = user_settings["mask_mode"]
    location_name = user_settings["location_camera_1"] if file1 == "file1" else user_settings["location_camera_2"]

    if not selected_models_file1 and not selected_models_file2:
        return jsonify({'error': 'No model selected'}), 400
    
    tasks = []
    responses = {}
    with ThreadPoolExecutor() as executor:
        def process_video(file, input_path, selected_models):
            if 'crowd' in selected_models:
                output_path_crowd = os.path.join(app.config['OUTPUT_FOLDER'], 'crowd_' + file.filename)
                tasks.append(executor.submit(CC_process_video_alternative, input_path, CROWD_MODEL, output_path_crowd, 0.25, 10, detection_threshold, cooldown_seconds, 0 ))
            if 'mask' in selected_models:
                tasks.append(executor.submit(MASK_process_video_for_detections, input_path, MASK_MODEL, cooldown_seconds,mask_mode))
            if 'queue' in selected_models:
                tasks.append(executor.submit(QUEUE_process_video_for_detections, input_path, QUEUE_MODEL, cooldown_seconds ))
            if 'smoke' in selected_models:
                tasks.append(executor.submit(SMOKE_process_video_for_detections, input_path, SMOKE_MODEL, cooldown_seconds))
            if 'anamoly' in selected_models:
                output_path_anamoly = os.path.join(app.config['OUTPUT_FOLDER'], 'anamoly_' + file.filename)
                tasks.append(executor.submit(
                    anamoly_process_video, 
                    input_path, output_path_anamoly, cooldown_seconds, location_name
                ))
        if file1:
            input_path1 = os.path.join(app.config['UPLOAD_FOLDER'], file1.filename)
            file1.save(input_path1)
            process_video(file1, input_path1, selected_models_file1)
        
        if file2:
            input_path2 = os.path.join(app.config['UPLOAD_FOLDER'], file2.filename)
            file2.save(input_path2)
            process_video(file2, input_path2, selected_models_file2)
        
        for future in as_completed(tasks):
            try:
                result = future.result()
                if isinstance(result, tuple):
                    model_type, output = result
                    responses[model_type] = str(output)
                else:
                    responses[str(result)] = f"{result} detection logged successfully."
            except Exception as e:
                responses['error'] = f"Error during processing: {str(e)}"
    
    return jsonify({'message': 'Processing completed', 'results': responses})


@app.route('/download')
def download_file():
    """Download the processed video."""
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400
    file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    return send_file(file_path, as_attachment=True)

@app.route('/webcam', methods=['POST'])
def webcam_feed():
    global is_live_feed_running

    data = request.json
    action = data.get('action')  # 'start' or 'stop'
    feed_id = data.get('feed_id')  # 'feed1' or 'feed2'
    selected_models = data.get('models', [])
    # detection_threshold = int(data.get('threshold', 5))
    detection_threshold = user_settings["threshold"]
    cooldown_seconds = user_settings["cooldown"]
    mask_mode = user_settings["mask_mode"]
    location_name = user_settings["location_camera_1"] if feed_id == "feed1" else user_settings["location_camera_2"]


    if action == 'stop':
        is_live_feed_running[feed_id] = False
        return jsonify({'message': f'Live feed {feed_id} stopped.'})

    if action == 'start':
        if not selected_models:
            return jsonify({'error': 'No model selected'}), 400

        is_live_feed_running[feed_id] = True
        responses = {}
        camera_index = 0 if feed_id == "feed1" else 1

        try:
            video_capture = cv2.VideoCapture(camera_index)
            if not video_capture.isOpened():
                return jsonify({'error': f'Unable to access {feed_id}'}), 500

            def process_frame(frame):
                tasks = []
                results = {}

                with ThreadPoolExecutor() as executor:
                    if 'crowd' in selected_models:
                        tasks.append(executor.submit(CC_process_webcam_feed, frame, CROWD_MODEL, 0.25, 10, detection_threshold, cooldown_seconds, 3,location_name))
                    if 'mask' in selected_models:
                        tasks.append(executor.submit(MASK_detect_objects_from_webcam, frame, MASK_MODEL, cooldown_seconds,location_name,mask_mode))
                    if 'queue' in selected_models:
                        tasks.append(executor.submit(QUEUE_detect_objects_from_webcam, frame, QUEUE_MODEL, cooldown_seconds,location_name))
                    if 'smoke' in selected_models:
                        tasks.append(executor.submit(SMOKE_detect_objects_from_webcam, frame, SMOKE_MODEL, cooldown_seconds,location_name))
                    if 'anamoly' in selected_models:
                        tasks.append(executor.submit(
                            anamoly_process_webcam_feed, 
                            frame, cooldown_seconds, location_name
                        ))

                    for future in as_completed(tasks):
                        try:
                            result = future.result()
                            if isinstance(result, tuple):
                                model_type, output = result
                                results[model_type] = str(output)
                            else:
                                results[str(result)] = f"{result} detection logged successfully."
                        except Exception as e:
                            results['error'] = f"Error during processing: {str(e)}"
                return results

            while is_live_feed_running[feed_id]:
                ret, frame = video_capture.read()
                if not ret:
                    break

                frame_results = process_frame(frame)
                responses.update(frame_results)

                cv2.imshow(f'Live Feed - {feed_id}', frame)

                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

        except Exception as e:
            return jsonify({'error': f'Error during live processing: {str(e)}'}), 500

        finally:
            video_capture.release()
            cv2.destroyAllWindows()

        return jsonify({'message': f'Live feed {feed_id} processing completed', 'results': responses})

@app.route('/alerts', methods=['GET'])
def fetch_alerts():
    #global last_crowd_alert_time

    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        # Fetch all alerts from the Alerts table
        cursor.execute('''
            SELECT Camera_ID, Location_Name, Alert_Type, Detected_Value, Timestamp
            FROM Alerts
            ORDER BY Timestamp DESC
        ''')
        alerts = cursor.fetchall()

        alerts_with_images = []
        now = datetime.now()
        for alert in alerts:
            alert_dict = {
                'camera_id': alert[0],
                'location_name': alert[1],
                'alert_type': alert[2],
                'detected_value': alert[3],
                'timestamp': alert[4],
                'image': None  # Default value for image
            }

            # Implement 90-second cooldown for "Crowd" alerts
            # if alert[2] == "Crowd":
            #     alert_time = datetime.strptime(alert[4], '%Y-%m-%d %H:%M:%S')
            #     if last_crowd_alert_time and now - last_crowd_alert_time < timedelta(seconds=45):
            #         continue  # Skip this "Crowd" alert
            #     last_crowd_alert_time = alert_time

            # Fetch image for "Mask" alerts from Mask_Detection table
            if alert[2] == "No-Mask":
                cursor.execute('''
                    SELECT Image FROM Mask_Detection
                    WHERE Camera_ID = ? ORDER BY Timestamp DESC LIMIT 1
                ''', (alert[0],))
                mask_image = cursor.fetchone()
                if mask_image and mask_image[0]:
                    alert_dict['image'] = base64.b64encode(mask_image[0]).decode('utf-8')

            # Fetch image for "Smoke" alerts from Smoking_Detection table
            elif alert[2] == "Smoking":
                cursor.execute('''
                    SELECT Image FROM Smoking_Detection
                    WHERE Camera_ID = ? ORDER BY Timestamp DESC LIMIT 1
                ''', (alert[0],))
                smoke_image = cursor.fetchone()
                if smoke_image and smoke_image[0]:
                    alert_dict['image'] = base64.b64encode(smoke_image[0]).decode('utf-8')

            # Fetch image for "Queue" alerts from Mask_Detection table
            elif alert[2] == "No-Queue":
                cursor.execute('''
                    SELECT Image FROM Queue_Detection
                    WHERE Camera_ID = ? ORDER BY Timestamp DESC LIMIT 1
                ''', (alert[0],))
                smoke_image = cursor.fetchone()
                if smoke_image and smoke_image[0]:
                    alert_dict['image'] = base64.b64encode(smoke_image[0]).decode('utf-8')                    

            alerts_with_images.append(alert_dict)

        conn.close()
        return jsonify(alerts_with_images)
    
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return jsonify({"error": str(e)}), 500

user_settings = {
    "threshold": 20,
    "cooldown": 40,
    "mask_mode": "mask",
    "location_camera_1": "MainHall",
    "location_camera_2": "Entrance"
}

@app.route('/set_settings', methods=['POST'])
def set_settings():
    print("SETTINGS CALLED")
    data = request.get_json()
    user_settings.update({
        "threshold": int(data.get("threshold", 37)),
        "cooldown": int(data.get("cooldown", 90)),
        "mask_mode": data.get("mask_mode", "mask"),
        "location_camera_1": data.get("location_camera_1", "MainHall"),
        "location_camera_2": data.get("location_camera_2", "Entrance")
    })
    return jsonify({"message": "Settings updated", "settings": user_settings}), 200

#-------Data Fetching from Backend for Analytics Page-----
#-------for crowd count line chart
@app.route('/api/crowd', methods=['GET'])
def get_crowd_data():
    conn = sqlite3.connect('VV.db')
    cursor = conn.cursor()

    cursor.execute("SELECT MAX(Timestamp) FROM CrowdControl")
    latest_time = cursor.fetchone()[0]

    if not latest_time:
        conn.close()
        return jsonify([])  

    cursor.execute("""
        SELECT Timestamp, No_of_Detections 
        FROM CrowdControl
        WHERE Timestamp < ?
        ORDER BY Timestamp DESC
        LIMIT 10
    """, (latest_time,))
    rows = cursor.fetchall()
    conn.close()

    chart_data = [
        {
            'time': datetime.strptime(row[0], "%Y-%m-%d %H:%M:%S").strftime('%H:%M'),
            'count': row[1]
        }
        for row in reversed(rows)
    ]

    print("Chart Data:", chart_data)
    return jsonify(chart_data)

#-------for all models anomaly detection (PIE CHART)
@app.route('/api/detection-distribution', methods=['GET'])
def get_detection_distribution():
    conn = sqlite3.connect('VV.db')
    cursor = conn.cursor()

    models = {
        "Crowd Control": "CrowdControl",
        "Mask Detection": "Mask_Detection",
        "Queue Detection": "Queue_Detection",
        "Smoking Detection": "Smoking_Detection",
        "Suspicious Activity": "Sussy_Detection"
    }

    data = []
    for label, table in models.items():
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            data.append({"name": label, "value": count})
        except Exception as e:
            data.append({"name": label, "value": 20})  

    conn.close()
    return jsonify(data)

#-------for the types of suspicious detection (BAR CHART)
@app.route('/api/suspicious-activity-types', methods=['GET'])
def get_suspicious_activity_types():
    conn = sqlite3.connect('VV.db')
    cursor = conn.cursor()

    activity_types = ['Shooting', 'Robbery', 'Fighting']
    data = []

    for activity in activity_types:
        try:
            cursor.execute(
                "SELECT COUNT(*) FROM Sussy_Detection WHERE Activity_Type = ?",
                (activity,)
            )
            count = cursor.fetchone()[0]
            data.append({"type": activity, "count": count})
        except Exception as e:
            data.append({"type": activity, "count": 20})

    conn.close()
    print(data)
    return jsonify(data)


if __name__ == '__main__':
    app.run(debug=True, port=5000)