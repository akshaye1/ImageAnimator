from flask import Flask, request, send_file, jsonify, Blueprint
from flask_cors import CORS
from PIL import Image
import os
from io import BytesIO
from border import add_crumple_texture_overlay
import uuid

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

image_routes = Blueprint('image_routes', __name__)
CORS(image_routes)

@image_routes.route('/add_border', methods=['POST', 'OPTIONS'])
def process_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_name, file_extension = os.path.splitext(file.filename)
    unique_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_FOLDER, f"{unique_id}_{file.filename}")
    output_path = os.path.join(OUTPUT_FOLDER, f"processed_{unique_id}_{file.filename}")

    file.save(input_path)

    texture_opacity = int(request.form.get('textureOpacity', 100))

    add_crumple_texture_overlay(
        input_path=input_path,
        output_path=output_path,
        texture_path="textures/crumpled-craft-beige-paper.jpg",
        texture_opacity=texture_opacity
    )

    response = send_file(output_path, as_attachment=True, mimetype='image/png')
    response.headers["Content-Disposition"] = f"attachment; filename=processed_image.png"
    response.access_control_allow_origin = "*"

    return response