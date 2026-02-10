from dotenv import load_dotenv
import os
import google.generativeai as genai
from google.api_core.exceptions import DeadlineExceeded, ResourceExhausted
import re
import json
import time

load_dotenv()

def extract_json_from_output(output):
  # Try to find JSON in markdown code blocks first
  pattern = r'```json\n([\s\S]*?)\n```'
  match = re.search(pattern, output)
  if match:
    try:
      return json.loads(match.group(1))
    except json.JSONDecodeError:
      pass

  # If no markdown block or it failed to parse, try to find the first '{' and last '}'
  try:
    start_index = output.find('{')
    end_index = output.rfind('}')
    if start_index != -1 and end_index != -1:
      json_str = output[start_index:end_index+1]
      return json.loads(json_str)
  except (json.JSONDecodeError, ValueError):
    pass

  return None

def generate_content(system_instruction, search_prompt):
  API_KEY = os.getenv('REACT_APP_geminiAIKey', "")
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

  model = genai.GenerativeModel(
    "models/gemini-2.0-flash",
    system_instruction=system_instruction,
    generation_config=GENERATION_CONFIG,
    safety_settings=SAFETY_SETTINGS,
  )

  response = None

  for _ in range(1): 
    try:
      response = model.generate_content(["Follow the system instructions and", search_prompt])
      print("Original Response", response.text)
      newText = extract_json_from_output(response.text)
      if newText:
        break  # If successful, break the loop
      print("Failed to extract JSON from response. Retrying...")
    except DeadlineExceeded:
      print("Deadline exceeded. Retrying in 1 second...")
      time.sleep(1)
    except json.JSONDecodeError:
      print("JSON decode error. Retrying in 1 second...")
      time.sleep(1)
    except ResourceExhausted:
      print("Resource exhausted. Retrying in 10 second...")
      time.sleep(10)
    except ValueError:
      print("A value error occurred. Retrying in 1 second...")
      # If the response doesn't contain text, check if the prompt was blocked.
      if response is not None:
        print(response.prompt_feedback)
        # Also check the finish reason to see if the response was blocked.
        print(response.candidates[0].finish_reason)
        # If the finish reason was SAFETY, the safety ratings have more details.
        print(response.candidates[0].safety_ratings)
      time.sleep(1)  # Wait for 1 second
  else:  # If all retries fail
    print("Failed to generate content after 2 attempts.")
    return None

  return newText