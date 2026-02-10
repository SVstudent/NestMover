# Filename - server.py
 
# Import flask and datetime module for showing date and time
from flask import Flask, request, jsonify
from flask_cors import CORS  # new
import datetime
from werkzeug.utils import secure_filename
import tempfile
import os

from scripts.system_instructions import generate_content
from scripts.file_input_system_instructions import generate_content_with_file
from scripts.people_info_api_request import fetch_people_info
from scripts.google_drive_file_extractor import download_file
from scripts.google_place_info_extractor import get_google_info

app = Flask(__name__)
CORS(app)  

@app.route('/get-google-place-info', methods=['GET'])
def get_google_place_info_route():
    address = request.args.get('address', '')
    place = request.args.get('place', '')
    home_address = request.args.get('home_address', '')
    result = get_google_info(address, place, home_address)
    return jsonify(result)

@app.route('/get-google-drive-file', methods=['POST'])
def get_google_drive_file_route():
    data = request.get_json()
    file_id = data.get('file_id', '')
    oauth_token = data.get('oauth_token', '')
    result = download_file(file_id, oauth_token)
    return result

@app.route('/fetch-people-info', methods=['POST'])
def fetch_people_info_route():
    data = request.get_json()
    token = data.get('token', '')
    result = fetch_people_info(token)
    return jsonify(result)

@app.route('/generate-content', methods=['POST'])
def generate_content_route():
    print("Generating content")
    try:
        data = request.get_json()
        system_instruction = data.get('system_instruction', '')
        search_prompt = data.get('search_prompt', '')
        result = generate_content(system_instruction, search_prompt)
        if result is None:
            return jsonify({"error": "Failed to generate content"}), 500
        return jsonify(result)
    except Exception as e:
        print(f"Error in generate_content: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate-profile', methods=['POST'])
def generate_profile_route():
  print("generate-profile endpoint called")
  
  if 'file' not in request.files:
    print("Error: No file in request")
    return jsonify({"error": "No file part in request"}), 400
  
  file = request.files['file']
  if not file.filename:
    print("Error: Empty filename")
    return jsonify({"error": "No file selected"}), 400
  
  system_instruction = request.form.get('system_instruction', '')
  if not system_instruction:
    print("Error: No system instruction provided")
    return jsonify({"error": "No system instruction provided"}), 400
  
  print(f"Processing file: {file.filename}")
  print(f"System instruction length: {len(system_instruction)}")

  try:
    result = generate_content_with_file(file, system_instruction)
    if result is None:
      print("Error: generate_content_with_file returned None")
      return jsonify({"error": "Failed to generate content - API returned no data"}), 500
    print(f"Successfully generated profile data: {str(result)[:200]}...")
    return jsonify(result)
  except ValueError as e:
    print(f"ValueError in generate_profile: {e}")
    return jsonify({"error": str(e)}), 500
  except Exception as e:
    print(f"Unexpected error in generate_profile: {type(e).__name__}: {e}")
    return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# Route for seeing a data
@app.route('/')
def get_time():
  x = datetime.datetime.now()
 
  # Returning an api for showing in  reactjs
  return {
    'Name':"MS..AI", 
    "Age":"22",
    "Date": x.strftime("%m/%d/%Y, %H:%M:%S"), 
    "programming":"python"
    }
 
   
# Running app
if __name__ == '__main__':
  app.run(debug=True)