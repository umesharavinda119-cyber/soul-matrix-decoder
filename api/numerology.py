from http.server import BaseHTTPRequestHandler
import json
import re

# --- DICTIONARIES & MAPPINGS ---
chaldean_dict = {
    'A':1, 'B':2, 'C':3, 'D':4, 'E':5, 'F':8, 'G':3, 'H':5, 'I':1,
    'J':1, 'K':2, 'L':3, 'M':4, 'N':5, 'O':7, 'P':8, 'Q':1, 'R':2,
    'S':3, 'T':4, 'U':6, 'V':6, 'W':6, 'X':5, 'Y':1, 'Z':7
}
planets = {1:'රවි', 2:'සඳු', 3:'ගුරු', 4:'රාහු', 5:'බුධ', 6:'සිකුරු', 7:'කේතු', 8:'ශනි', 9:'කුජ'}
explicit_enemies = {1: [6,8], 2: [], 3: [4], 4: [3,6,9], 5: [], 6: [8], 7: [6,8], 8: [3,6,9], 9: [4,8]}
special_obstacles = {1: 8, 2: 4, 5: 9, 7: 8}
best_friends = {1:4, 2:7, 3:9, 4:1, 5:6, 6:5, 7:2, 8:1, 9:3}

navagraha_points = {
    1: [5,4,2,4,3,2,3,3,2], 2: [4,5,2,1,3,2,4,2,2], 3: [2,2,5,0,2,3,2,1,4],
    4: [4,2,0,5,2,1,2,3,1], 5: [3,3,2,2,5,4,3,2,2], 6: [2,2,3,1,4,5,2,0,3],
    7: [3,4,2,2,3,2,5,1,2], 8: [3,2,1,3,2,0,2,5,0], 9: [2,2,4,1,2,3,2,0,5]
}

# --- HELPER FUNCTIONS ---
def reduce_with_master(n):
    karmic = []
    if n in [13, 14, 16, 19]: karmic.append(n)
    while n > 9 and n not in [11, 22, 33]:
        n = sum(int(d) for d in str(n))
        if n in [13, 14, 16, 19] and n not in karmic: karmic.append(n)
    return n, karmic

def reduce_simple(n):
    while n > 9:
        n = sum(int(d) for d in str(n))
    return n

def get_bottom_box(top1, top2):
    rem = (top1 + top2) % 9
    return 9 if rem == 0 else 9 - rem

def calculate_business_name(b_name):
    if not b_name: return 0
    ignore_words = ["LTD", "COMPANY", "BANK", "STORES", "ENTERPRISES", "LIMITED", "INC", "CORP"]
    parts = b_name.upper().split()
    valid_parts = [p for p in parts if p.strip(',.') not in ignore_words]
    clean_str = re.sub(r'[^A-Z]', '', "".join(valid_parts))
    return reduce_simple(sum(chaldean_dict.get(c, 0) for c in clean_str))

def get_zenith_karma_rules(driver):
    rules = []
    if driver == 1:
        rules.append("[KARMA/WEAKNESS] අන් අයට දැනෙන ලෙස ආදරය පෙන්වීමට ඇති නොහැකියාව පවුල් ජීවිතයට බලපායි. සෙනසුරාදා දිනය තරමක් බාධාකාරී විය හැක.")
    if driver == 3:
        rules.append("[KARMA/FINANCE] කෙනෙකුට ණය මුදලක් ලබා දුනහොත් එය නැවත ලබාගැනීම අතිශය දුෂ්කරය! ණය දීමෙන් වළකින්න.")
        rules.append("[KARMA/CHILDHOOD] 75% කට වඩා ඉඩක් ඇත කුඩා කාලයේදී ලැබිය යුතු ආදරයේ අඩුවක් හෝ දෙමාපියන්ගෙන් ඈත්වීමක් සිදුවීමට.")
    if driver == 4:
        rules.append("[CAREER THREAT] පාලක පන්තියේ හෝ ඉහළ තනතුරු දරන්නන්ගේ ප්‍රසාදය අහිමි වන අතර නිරන්තර විරෝධතාවලට ලක්වේ.")
    return rules

def get_exact_gem_placement(driver):
    gems = {
        1: "පද්මරාග (Ruby) - දකුණු අතේ වෙදැඟිල්ලට",
        2: "චන්ද්‍රකාන්ත / මුතු - වම් අතේ සුලැඟිල්ලට",
        3: "පුෂ්පරාග - දකුණු හෝ වම් අතේ දබරඟිල්ලට",
        4: "පද්මරාග (රවිගේ බලය වැඩිකිරීමට) - දකුණු අතේ වෙදැඟිල්ලට",
        5: "තෝර පච්ච - දකුණු අතේ සුලැඟිල්ලට",
        6: "නිල් මැණික් / දියමන්ති (ඇඟිල්ල අභිමතය පරිදි)",
        7: "චන්ද්‍රකාන්ත - වම් අතේ සුලැඟිල්ලට (ප්ලැටිනම් ලෝහයෙන්)",
        8: "අවවාදයයි! කාක නිල් සුදුසු නැත. පද්මරාග - දකුණු අතේ වෙදැඟිල්ලට",
        9: "රතු මැණික් - දකුණු අතේ වෙදැඟිල්ලට"
    }
    return gems.get(driver, "සාමාන්‍ය පළඳනා ක්‍රමවේදය")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            full_name = data.get('full_name_en', '')
            full_name_si = data.get('full_name_si', '')
            dob_year = int(data.get('year', 0))
            dob_month = int(data.get('month', 0))
            dob_day = int(data.get('day', 0))
            business_name = data.get('business_name', '')

            # Core Calcs
            driver = reduce_simple(dob_day)
            raw_dob_digits_sum = sum(int(d) for d in f"{dob_year}{dob_month:02d}{dob_day:02d}")
            lifepath, lp_karmic = reduce_with_master(raw_dob_digits_sum)
            lp_single = reduce_simple(lifepath)

            clean_full_name = re.sub(r'[^A-Z]', '', full_name.upper())
            chaldean_sum_full = sum(chaldean_dict.get(c, 0) for c in clean_full_name)
            name_value_single = reduce_simple(chaldean_sum_full)
            first_letter_val = chaldean_dict.get(clean_full_name[0], 0) if clean_full_name else 0
            business_val = calculate_business_name(business_name)

            # Navagraha Matrix
            sq_sun = lp_single
            sq_moon = driver
            sq_jup = first_letter_val
            sq_rahu = best_friends.get(sq_moon, sq_moon)
            sq_merc = best_friends.get(sq_sun, sq_sun)
            sq_ven = name_value_single
            sq_ketu = get_bottom_box(sq_sun, sq_rahu)
            sq_sat = get_bottom_box(sq_moon, sq_merc)
            sq_mars = get_bottom_box(sq_jup, sq_ven)

            matrix = [sq_sun, sq_moon, sq_jup, sq_rahu, sq_merc, sq_ven, sq_ketu, sq_sat, sq_mars]
            pts = [navagraha_points[i+1][matrix[i]-1] for i in range(9)]
            total_pts = sum(pts)

            # Obstacle Number & Life Code
            destiny_enemies = explicit_enemies.get(lp_single, [])
            obstacle_number = None
            if driver == lp_single and explicit_enemies.get(lp_single):
                obstacle_number = explicit_enemies[lp_single][0]
            else:
                first_6 = matrix[:6]
                for e in destiny_enemies:
                    if e in first_6:
                        obstacle_number = e; break
                if not obstacle_number and lp_single in special_obstacles:
                    if special_obstacles[lp_single] in first_6: obstacle_number = special_obstacles[lp_single]
                if not obstacle_number:
                    obstacle_number = 4 if 4 in first_6 else (8 if 8 in first_6 else 0)

            life_code = "".join(str(x) for x in matrix[:8])

            response_payload = {
                "status": "success",
                "data": {
                    "full_name_en": full_name,
                    "full_name_si": full_name_si,
                    "dob": f"{dob_year}-{dob_month:02d}-{dob_day:02d}",
                    "driver_number": driver,
                    "lifepath_number": lifepath,
                    "lifepath_karmic": lp_karmic,
                    "expression_number": name_value_single,
                    "business_number": business_val,
                    "navagraha_matrix": {
                        "sun": sq_sun, "moon": sq_moon, "jupiter": sq_jup,
                        "rahu": sq_rahu, "mercury": sq_merc, "venus": sq_ven,
                        "ketu": sq_ketu, "saturn": sq_sat, "mars": sq_mars
                    },
                    "total_points": total_pts,
                    "obstacle_number": obstacle_number,
                    "life_code": life_code,
                    "karma_rules": get_zenith_karma_rules(driver),
                    "gemstone_info": get_exact_gem_placement(driver),
                    "instructions": {
                        "time_rule": "අංක විද්‍යාවට අනුව දවසක උදාව තීරණය වන්නේ 'මධ්‍යම රාත්‍රී 12.00 පසුවීමත් සමඟය'.",
                        "morning_mantra": "දින 21ක් උදේ 5-7 අතර ඊශාන දිශාව බලා වාක්‍ය 7 තුන්වරක් ශබ්ද නගා කිව යුතුය.",
                        "night_mantra": "නින්දට පෙර භවාංග සිතට ආමන්ත්‍රණය කරන වාක්‍ය 3 තුන්වරක් කිව යුතුය.",
                        "paper_rule": "SMART ඉලක්කය අනිවාර්යයෙන්ම අඟල් 5x5 හෝ 7x7 සුදු කඩදාසියක රතු පෑනෙන් පමණක් ලිවිය යුතුය."
                    }
                }
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(json.dumps(response_payload, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
