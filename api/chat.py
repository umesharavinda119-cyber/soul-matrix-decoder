import os
import json
import base64
import requests
from datetime import datetime, timezone, timedelta
import google.generativeai as genai
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    # 1. CORS Preflight Requests (Browser Block වීම නතර කිරීමට)
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.ශ්‍රී ලංකා වේලාව (UTC+5:30) සජීවීව පද්ධතියට සම්බන්ධ කර, CORS Header ප්‍රශ්න නිරවුල් කර, නිවැරදි Gemini Model නාමය සහිතව සකස් කළ සම්පූර්ණ `chat.py` Code එක මෙන්න. 

මෙහිදී බාහිර Packages (පිටත Libraries) මත පදනම් නොවී Python වල Standard `datetime` සහ `timezone` භාවිතා කර ඇති බැවින් Vercel Serverless පරිසරයේ කිසිදු Dependency Error එකක් මතුවන්නේ නැත.

```python
import base64
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler
import json
import os
import google.generativeai as genai
import requests


class handler(BaseHTTPRequestHandler):

  def _set_cors_headers(self):
    """CORS Headers සකස් කිරීම මඟින් Web UI එකෙන් එන Requests Block වීම වළක්වයි."""
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header(
        'Access-Control-Allow-Methods', 'POST, OPTIONS, GET, PUT'
    )
    self.send_header(
        'Access-Control-Allow-Headers', 'Content-Type, Authorization'
    )

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
      current_time_str = now_sl.strftime('%Y-%m-%d %I:%M:%S %p (%A)')

      # 3. Check API Key
      api_key = os.environ.get('GEMINI_API_KEY')
      if not api_key:
        raise Exception(
            'GEMINI_API_KEY is not set in Vercel Environment Variables.'
        )

      # 4. Gemini AI Setup (Standard Active Model)
      genai.configure(api_key=api_key)
      model = genai.GenerativeModel('gemini-1.5-flash')

      system_prompt = (
          "You are Aravinda, an AI assistant for 'Radiance of Numbers'. "
          f"CURRENT LIVE DATE & TIME IN SRI LANKA: {current_time_str}. "
          'Respond in the language requested by user (Sinhala, Singlish, or'
          ' English). Keep responses short, accurate, and helpful.'
      )

      prompt = (
          f'System: {system_prompt}\nUser Language: {lang}\nUser Input:'
          f' {user_message}\nResponse:'
      )

      response = model.generate_content(prompt)
      bot_text = (
          response.text.strip()
          if response and response.text
          else 'No text generated.'
      )

      audio_base64 = None

      # 5. ElevenLabs Voice Generation
      if use_voice:
        eleven_api = os.environ.get('ELEVENLABS_API_KEY')
        voice_id = os.environ.get('ELEVENLABS_VOICE_ID')

        if eleven_api and voice_id:
          tts_url = f'[https://api.elevenlabs.io/v1/text-to-speech/](https://api.elevenlabs.io/v1/text-to-speech/){voice_id}'
          headers = {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': eleven_api,
          }
          data = {
              'text': bot_text,
              'model_id': 'eleven_multilingual_v2',
              'voice_settings': {'stability': 0.5, 'similarity_boost': 0.75},
          }

          tts_res = requests.post(
              tts_url, json=data, headers=headers, timeout=10
          )
          if tts_res.status_code == 200:
            audio_base64 = base64.b64encode(tts_res.content).decode('utf-8')

      # 6. Success Response
      self.send_response(200)
      self.send_header('Content-type', 'application/json')
      self._set_cors_headers()
      self.end_headers()

      self.wfile.write(
          json.dumps({'reply': bot_text, 'audio': audio_base64}).encode('utf-8')
      )

    except Exception as e:
      # 7. Error Response
      self.send_response(500)
      self.send_header('Content-type', 'application/json')
      self._set_cors_headers()
      self.end_headers()
      self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
