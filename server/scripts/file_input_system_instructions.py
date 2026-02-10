import tempfile
from dotenv import load_dotenv
import os
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted
from google.api_core.exceptions import DeadlineExceeded
import re
import json
import time

load_dotenv()


def extract_json_from_output(output):
    """Extract JSON from model output, handling both markdown code blocks and raw JSON."""
    if not output:
        print("Empty output received")
        return None
    
    # Try to find JSON enclosed in ```json ``` markers first
    pattern = r'```json\n([\s\S]*?)\n```'
    match = re.search(pattern, output)
    
    json_string = ""
    if match:
        json_string = match.group(1)
    else:
        # Try to find the first '{' and last '}' if no markdown block
        start_index = output.find('{')
        end_index = output.rfind('}')
        if start_index != -1 and end_index != -1 and end_index > start_index:
            json_string = output[start_index:end_index+1]
        else:
            print("No JSON structure found in output")
            return None
    
    # Clean up escape sequences
    json_string = json_string.replace('\\\\', '\\')
    
    # Converting the JSON string into a Python dictionary
    try:
        result = json.loads(json_string)
        print("Successfully parsed JSON:", json.dumps(result, indent=2)[:500])
        return result
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        print(f"Problematic JSON string: {json_string[:500]}...")
        return None


def generate_content_with_file(file, system_instruction):
    API_KEY = os.getenv('REACT_APP_geminiAIKey', "")
    if not API_KEY:
        print("ERROR: No API key found!")
        raise ValueError("Missing Gemini API key")
    
    print("API_KEY:", API_KEY[:10] + "..." if len(API_KEY) > 10 else API_KEY)
    genai.configure(api_key=API_KEY)

    GENERATION_CONFIG = {
        "temperature": 1,
        "top_p": 0.95,
        "top_k": 0,
    }

    SAFETY_SETTINGS = [
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_NONE"
        },
    ]
    
    temp_file = tempfile.NamedTemporaryFile(suffix=".txt", delete=True)
    file.save(temp_file.name)

    with open(temp_file.name, 'r', encoding='utf-8') as f:
        content = f.read(900000)
    
    if not content.strip():
        print("ERROR: Empty file content")
        raise ValueError("Uploaded file is empty")
    
    print(f"File content length: {len(content)} characters")

    model = genai.GenerativeModel(
        "models/gemini-2.0-flash",
        system_instruction=system_instruction,
        generation_config=GENERATION_CONFIG,
        safety_settings=SAFETY_SETTINGS,
    )

    # Initialize newText to None before the retry loop
    newText = None
    last_error = None

    for attempt in range(3):  # Retry up to 3 times
        try:
            print(f"Attempt {attempt + 1}/3: Generating content...")
            response = model.generate_content(["Follow the system instructions", content])
            
            if not response or not response.text:
                print(f"Attempt {attempt + 1}: Empty response from model")
                continue
            
            print(f"Attempt {attempt + 1}: Received response ({len(response.text)} chars)")
            newText = extract_json_from_output(response.text)
            
            if newText:
                print(f"Attempt {attempt + 1}: Successfully extracted JSON")
                break
            else:
                print(f"Attempt {attempt + 1}: Failed to extract JSON from response")
                
        except DeadlineExceeded as e:
            print(f"Attempt {attempt + 1}: Deadline exceeded")
            last_error = e
            time.sleep(1)
        except ResourceExhausted as e:
            print(f"Attempt {attempt + 1}: Resource exhausted")
            last_error = e
            time.sleep(10)
        except ValueError as e:
            print(f"Attempt {attempt + 1}: Value error - {e}")
            last_error = e
            if response is not None:
                try:
                    print("Prompt feedback:", response.prompt_feedback)
                    if response.candidates:
                        print("Finish reason:", response.candidates[0].finish_reason)
                        print("Safety ratings:", response.candidates[0].safety_ratings)
                except Exception as inner_e:
                    print(f"Could not get error details: {inner_e}")
            time.sleep(1)
        except Exception as e:
            print(f"Attempt {attempt + 1}: Unexpected error - {type(e).__name__}: {e}")
            last_error = e
            time.sleep(1)
    
    if newText is None:
        error_msg = f"Failed to generate valid content after 3 attempts. Last error: {last_error}"
        print(error_msg)
        raise ValueError(error_msg)
    
    return newText