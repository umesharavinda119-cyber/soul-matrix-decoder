import os
import json
import base64
import requests
from datetime import datetime, timezone, timedelta
import google.generativeai as genai
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):

    def _set_cors_headers(self):
        """CORS Headers set කිරීම මඟින් Web UI එකෙන් එන Requests Block වීම වළක්වයි."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET, PUT')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        """CORS Preflight Requests සඳහා පිළිතුරු සැපයීම."""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            # 1. Read Payload
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            req_body = json.loads(post_data) if post_data else {}

            user_message = req_body.get('message', '')
            use_voice = req_body.get('voice', False)
            lang = req_body.get('lang', 'si')

            # 2. Live Time Auto-Sync (Sri Lanka Standard Time UTC +5:30)
            sl_timezone = timezone(timedelta(hours=5, minutes=30))
            now_sl = datetime.now(sl_timezone)
            current_time_str = now_sl.strftime("%Y-%m-%d %I:%M %p (%A)")

            # 3. Check API Key
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                raise Exception("GEMINI_API_KEY is not set in Vercel Environment Variables.")

            # 4. Gemini AI Setup
            genai.configure(api_key=api_key)
            
            # STRICT SYSTEM PROMPT (Fixed AI hallucination and Date formatting)
            system_prompt = (
                "You are Aravinda, a human expert at 'Radiance of Numbers'.\n"
                "CRITICAL RULE: You MUST NEVER state or imply that you are an AI, a bot, or a language model. Always act entirely as a human.\n"
                f"REAL-TIME CONTEXT: Today's exact date and time in Sri Lanka is {current_time_str}.\n\n"
                "STRICT RULES:\n"
                "1. If the user asks for today's date or time, ALWAYS output the actual live date/time provided above. NEVER write bracket placeholders like '[Today's Date]' or '[Date]'.\n"
                "2. Respond in the exact language used by user (Sinhala, Singlish, or English).\n"
                "3. Keep responses short, accurate, and highly friendly."
            )
            
            # PROPER WAY to pass instructions to Gemini 1.5
            model = genai.GenerativeModel(
                model_name='gemini-1.5-flash',
                system_instruction=system_prompt
            )
            
            # Send ONLY the user message (System instructions are handled internally now)
            response = model.generate_content(user_message)
            bot_text = response.text.strip() if response and response.text else "No text generated."

            audio_base64 = None

            # 5. ElevenLabs Voice Generation
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
                    
                    tts_res = requests.post(tts_url, json=data, headers=headers, timeout=10)
                    if tts_res.status_code == 200:
                        audio_base64 = base64.b64encode(tts_res.content).decode('utf-8')

            # 6. Success Response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            self.wfile.write(json.dumps({
                "reply": bot_text,
                "audio": audio_base64
            }).encode('utf-8'))

        except Exception as e:
            # සැබෑ දෝෂය Vercel Logs වල සටහන් කිරීම
            print(f"!!! REAL ERROR: {str(e)}")
            
            # 7. Friendly Error Response (Prevents Frontend crashes on API limits)
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                user_msg = "අරවින්ද මේ මොහොතේ අධික පිරිසක් සමඟ සම්බන්ධ වී සිටී. කරුණාකර තව සුළු මොහොතකින් නැවත උත්සාහ කරන්න."
            else:
                user_msg = "තාක්ෂණික බාධාවක් සිදු විය. කරුණාකර සුළු මොහොතකින් නැවත උත්සාහ කරන්න."

            self.send_response(200) # Send 200 to keep UI stable
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"reply": user_msg}).encode('utf-8'))
