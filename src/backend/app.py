from flask import Flask, request, send_file, jsonify, render_template
from flask_cors import CORS
from PIL import Image
import os
from io import BytesIO
from process_img import image_routes

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def index():
    return render_template('index.html')

app.register_blueprint(image_routes, url_prefix='/images')

if __name__ == '__main__':
    app.run(debug=True)