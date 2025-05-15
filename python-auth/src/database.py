import psycopg2
import pickle
import numpy as np
from datetime import datetime

class FaceDatabase:
    def __init__(self, dbname="face_auth", user="postgres", password="postgres", host="localhost", port="5432"):
        self.conn = None
        self.cursor = None
        self.db_params = {
            'dbname': dbname,
            'user': user,
            'password': password,
            'host': host,
            'port': port
        }
        self.connect()
        self.create_tables()

    def connect(self):
        """Establish connection to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(**self.db_params)
            self.cursor = self.conn.cursor()
        except Exception as e:
            print(f"Error connecting to database: {str(e)}")
            raise

    def create_tables(self):
        """Create necessary tables if they don't exist"""
        try:
            # Create users table
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create face_data table
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS face_data (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    face_encoding BYTEA NOT NULL,
                    landmarks BYTEA,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            self.conn.commit()
        except Exception as e:
            print(f"Error creating tables: {str(e)}")
            raise

    def save_user_data(self, name, face_encoding, landmarks):
        """Save user data to the database"""
        try:
            # Convert numpy arrays to bytes
            face_encoding_bytes = pickle.dumps(face_encoding)
            landmarks_bytes = pickle.dumps(landmarks) if landmarks else None

            # Insert or update user
            self.cursor.execute("""
                INSERT INTO users (name) 
                VALUES (%s)
                ON CONFLICT (name) DO UPDATE 
                SET name = EXCLUDED.name
                RETURNING id
            """, (name,))
            
            user_id = self.cursor.fetchone()[0]
            
            # Insert face data
            self.cursor.execute("""
                INSERT INTO face_data (user_id, face_encoding, landmarks)
                VALUES (%s, %s, %s)
            """, (user_id, face_encoding_bytes, landmarks_bytes))
            
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error saving user data: {str(e)}")
            self.conn.rollback()
            return False

    def load_face_data(self):
        """Load all face data from the database"""
        try:
            self.cursor.execute("""
                SELECT u.name, fd.face_encoding, fd.landmarks
                FROM users u
                JOIN face_data fd ON u.id = fd.user_id
            """)
            
            face_data = self.cursor.fetchall()
            
            known_face_encodings = []
            known_face_names = []
            
            for name, face_encoding_bytes, _ in face_data:
                face_encoding = pickle.loads(face_encoding_bytes)
                known_face_encodings.append(face_encoding)
                known_face_names.append(name)
            
            return known_face_encodings, known_face_names
        except Exception as e:
            print(f"Error loading face data: {str(e)}")
            return [], []

    def __del__(self):
        """Cleanup database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close() 