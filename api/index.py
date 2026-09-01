from http.server import BaseHTTPRequestHandler
import json
import swisseph as swe

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)

        # Swiss Ephemeris Calculation
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        # Dummy Lat/Lon mapping (Colombo default)
        jd = swe.julday(int(data['year']), int(data['month']), int(data['day']), int(data['hour']) + int(data['minute'])/60.0 - 5.5)
        
        # Calculate Ascendant
        cusps, ascmc = swe.houses_ex(jd, 6.9271, 79.8612, b"P", swe.FLG_SIDEREAL)
        asc_deg = ascmc[0]
        
        signs = ["මේෂ", "වෘෂභ", "මිථුන", "කටක", "සිංහ", "කන්‍යා", "තුලා", "වෘශ්චික", "ධනු", "මකර", "කුම්භ", "මීන"]
        lagna_idx = int(asc_deg / 30)
        navamsha_idx = (int((asc_deg % 30) / (30/9)) + (lagna_idx * 9)) % 12

        response_data = {
            "status": "success",
            "lagna": f"{signs[lagna_idx]}<br>ලග්නය",
            "navamsha": f"{signs[navamsha_idx]}<br>නවාංශකය"
        }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))