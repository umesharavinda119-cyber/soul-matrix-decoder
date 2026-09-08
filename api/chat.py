import os
import json
import base64
import requests
import google.generativeai as genai
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 1. Read Payload
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data)

            user_message = req_body.get('message', '')
            use_voice = req_body.get('voice', False)
            lang = req_body.get('lang', 'si')

            # 2. Check API Key
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                raise Exception("GEMINI_API_KEY is not set in Vercel Environment Variables.")

            # 3. Gemini AI Setup (Updated Model Name)
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-3.6-flash')
            
            system_prompt = (
                "You are Aravinda, an AI assistant for 'Radiance of Numbers'. "
                "Respond in the language requested by user (Sinhala, Singlish, or English). Keep responses short and helpful."
            )
            
            prompt = f"System: {system_prompt}\nUser Language: {lang}\nUser Input: {user_message}\nResponse:"
            
            response = model.generate_content(prompt)
            bot_text = response.text.strip() if response and response.text else "No text generated."

            audio_base64 = None

            # 4. ElevenLabs Voice Generation
            if use_voice:
                eleven_api = os.environ.get("ELEVENLABS_API_KEY")
                voice_id = os.environ.get("ELEVENLABS_VOICE_ID")
                
                if eleven_api and voice_id:
                    tts_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
                    headers = {
                        "Accept": "audio/mpeg",
                        "Content-Type": "application/json",
                        "xi-api-key": eleven_api
                    }
                    data = {
                        "text": bot_text,
                        "model_id": "eleven_multilingual_v2",
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.75
                        }
                    }
                    
                    tts_res = requests.post(tts_url, json=data, headers=headers)
                    if tts_res.status_code == 200:
                        audio_base64 = base64.b64encode(tts_res.content).decode('utf-8')

            # 5. Success Response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                "reply": bot_text,
                "audio": audio_base64
            }).encode('utf-8'))

        except Exception as e:
            # 6. Error Response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
