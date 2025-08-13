import os

GROQ_API_KEY=os.environ.get("GROQ_API_KEY=")
import base64

image_path="acne.jpg"

def encode_image(image_path):   
    image_file=open(image_path, "rb")
    return base64.b64encode(image_file.read()).decode('utf-8')