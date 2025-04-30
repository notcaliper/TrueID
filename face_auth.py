import os
import pickle
import face_recognition
import cv2
import numpy as np
from datetime import datetime
import dlib
from imutils import face_utils
import urllib.request
import bz2

class FaceAuth:
    def __init__(self, data_dir="face_data"):
        # Initialize data structures first
        self.data_dir = data_dir
        self.known_face_encodings = []
        self.known_face_names = []
        self.video_capture = None
        self.confidence_threshold = 0.6  # Confidence threshold for face matching
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = None
        self.face_encodings = []
        self.face_names = []
        self.cap = None
        self.landmarks_file = "shape_predictor_68_face_landmarks.dat"
        
        # Download landmarks if not present
        if not os.path.exists(self.landmarks_file):
            self._download_landmarks()
            
        self.predictor = dlib.shape_predictor(self.landmarks_file)
        
        try:
            # Initialize video capture
            self.video_capture = cv2.VideoCapture(0)
            if not self.video_capture.isOpened():
                raise Exception("Could not open video capture device")
            
            # Load face data after successful initialization
            self.load_face_data()
            
        except Exception as e:
            # Clean up if initialization fails
            if self.video_capture is not None:
                self.video_capture.release()
            raise e
        
    def _download_landmarks(self):
        url = "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2"
        filename = "shape_predictor_68_face_landmarks.dat.bz2"
        
        print("Downloading facial landmark predictor...")
        urllib.request.urlretrieve(url, filename)
        
        # Extract the file
        with bz2.BZ2File(filename) as fr, open(self.landmarks_file, "wb") as fw:
            fw.write(fr.read())
        
        # Remove the compressed file
        os.remove(filename)
        print("Download and extraction complete!")
        
    def load_face_data(self):
        """Load existing face data from the data directory"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
            return
            
        # Load all user data files
        for filename in os.listdir(self.data_dir):
            if filename.endswith(".pkl"):
                try:
                    user_name = filename[:-4]  # Remove .pkl extension
                    with open(os.path.join(self.data_dir, filename), 'rb') as f:
                        user_data = pickle.load(f)
                        if isinstance(user_data, dict) and 'encoding' in user_data:
                            self.known_face_encodings.append(user_data['encoding'])
                            self.known_face_names.append(user_name)
                        else:
                            print(f"Warning: Invalid data format in {filename}")
                except Exception as e:
                    print(f"Error loading data for {user_name}: {str(e)}")
    
    def save_user_data(self, name, face_encoding, landmarks):
        """Save user data to a separate file"""
        user_data = {
            'encoding': face_encoding,
            'landmarks': landmarks,
            'registration_date': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        user_file = os.path.join(self.data_dir, f"{name}.pkl")
        with open(user_file, 'wb') as f:
            pickle.dump(user_data, f)
    
    def draw_landmarks(self, frame, landmarks):
        """Draw facial landmarks on the frame"""
        for i in range(0, 68):
            x = landmarks.part(i).x
            y = landmarks.part(i).y
            cv2.circle(frame, (x, y), 2, (0, 255, 0), -1)
    
    def show_camera_feed(self, title="Face Authentication"):
        """Show live camera feed with face detection and landmarks"""
        if self.video_capture is None:
            print("Error: Video capture not initialized")
            return False
            
        while True:
            ret, frame = self.video_capture.read()
            if not ret:
                print("Failed to capture image")
                return False
                
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.detector(gray)
            
            for face in faces:
                # Get facial landmarks
                landmarks = self.predictor(gray, face)
                
                # Draw face rectangle
                x, y, w, h = face.left(), face.top(), face.width(), face.height()
                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                
                # Draw landmarks
                self.draw_landmarks(frame, landmarks)
            
            # Display the resulting image
            cv2.imshow(title, frame)
            
            # Break the loop if 'q' is pressed
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
        cv2.destroyAllWindows()
        return True
    
    def get_face_encoding(self, frame, face_location):
        """Get face encoding for a detected face"""
        # Convert face location to dlib rectangle
        (top, right, bottom, left) = face_location
        rect = dlib.rectangle(left, top, right, bottom)
        
        # Get facial landmarks
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        shape = self.predictor(gray, rect)
        
        # Get face encoding using face_recognition
        face_encodings = face_recognition.face_encodings(frame, [face_location])
        if not face_encodings:
            return None
        return face_encodings[0]
    
    def register_face(self, name):
        """Register a new face with multiple captures"""
        if self.video_capture is None:
            print("Error: Video capture not initialized")
            return False
            
        print(f"Please look at the camera to register face for {name}...")
        print("We will capture multiple images for better accuracy")
        print("Press 'q' when you're ready to start capturing")
        
        # Show camera feed until user is ready
        self.show_camera_feed("Register Face")
        
        # Capture multiple frames
        face_encodings = []
        landmarks_list = []
        capture_count = 0
        max_captures = 5
        
        while capture_count < max_captures:
            print(f"Capturing image {capture_count + 1} of {max_captures}...")
            
            # Capture frame
            ret, frame = self.video_capture.read()
            if not ret:
                print("Failed to capture image")
                continue
            
            # Convert to grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect face
            faces = self.detector(gray)
            if not faces:
                print("No face detected, please try again")
                continue
            
            # Get face locations
            face_locations = face_recognition.face_locations(frame)
            if not face_locations:
                print("Could not detect face for encoding")
                continue
            
            # Get face encoding
            face_encoding = self.get_face_encoding(frame, face_locations[0])
            if face_encoding is None:
                print("Could not encode face")
                continue
            
            # Get facial landmarks
            landmarks = self.predictor(gray, faces[0])
            
            # Store the data
            face_encodings.append(face_encoding)
            landmarks_list.append(landmarks)
            
            capture_count += 1
            print("Capture successful!")
            
            # Wait a moment between captures
            cv2.waitKey(1000)
        
        if not face_encodings:
            print("Failed to capture any valid face images")
            return False
        
        # Average the face encodings
        avg_encoding = np.mean(face_encodings, axis=0)
        
        # Save user data
        self.save_user_data(name, avg_encoding, landmarks_list[0])  # Save first landmarks as reference
        
        # Update known faces
        self.known_face_encodings.append(avg_encoding)
        self.known_face_names.append(name)
        
        print(f"Successfully registered face for {name}")
        return True
    
    def authenticate(self):
        """Authenticate a face with confidence threshold"""
        if self.video_capture is None:
            print("Error: Video capture not initialized")
            return None
            
        print("Please look at the camera for authentication...")
        print("Press 'q' when you're ready to authenticate")
        
        # Show camera feed until user is ready
        self.show_camera_feed("Authenticate Face")
        
        # Capture frame
        ret, frame = self.video_capture.read()
        if not ret:
            print("Failed to capture image")
            return None
            
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect face
        faces = self.detector(gray)
        if not faces:
            print("No face detected")
            return None
            
        # Get face locations
        face_locations = face_recognition.face_locations(frame)
        if not face_locations:
            print("Could not detect face for encoding")
            return None
        
        # Get face encoding
        face_encoding = self.get_face_encoding(frame, face_locations[0])
        if face_encoding is None:
            print("Could not encode face")
            return None
        
        # Compare with known faces
        matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding)
        face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)
        
        # Find the best match
        best_match_index = np.argmin(face_distances)
        best_distance = face_distances[best_match_index]
        
        # Convert distance to confidence (0 to 1, where 1 is most confident)
        confidence = 1 - best_distance
        
        if matches[best_match_index] and confidence >= self.confidence_threshold:
            return self.known_face_names[best_match_index], confidence
        return None
    
    def __del__(self):
        """Cleanup when object is destroyed"""
        if self.video_capture is not None:
            self.video_capture.release()
        cv2.destroyAllWindows() 