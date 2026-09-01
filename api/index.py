from http.server import BaseHTTPRequestHandler
import json
import swisseph as swe
import math
from datetime import datetime, date, timedelta, timezone

def get_sri_lankan_historical_tz(year, month, day):
    b_date = date(year, month, day)
    if date(1942, 9, 1) <= b_date <= date(1945, 10, 15): return 6.5
    elif date(1996, 5, 25) <= b_date <= date(1996, 10, 25): return 6.5
    elif date(1996, 10, 26) <= b_date <= date(2006, 4, 14): return 6.0
    return 5.5

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            # Input Parameters
            client_name = data.get('name', 'Client')
            year = int(data.get('year', 1990))
            month = int(data.get('month', 1))
            day = int(data.get('day', 1))
            hour = int(data.get('hour', 12))
            minute = int(data.get('minute', 0))
            city = data.get('place', 'Colombo')
            lat = float(data.get('lat', 6.9271))
            lon = float(data.get('lon', 79.8612))

            # -------------------------------------------------------------
            # EXACT V12 ULTIMATE GOD-MODE CALCULATIONS
            # -------------------------------------------------------------
            decimal_hour = hour + (minute / 60.0)
            tz = get_sri_lankan_historical_tz(year, month, day)
            utc_hour = decimal_hour - tz

            swe.set_sid_mode(swe.SIDM_LAHIRI)
            jd = swe.julday(year, month, day, utc_hour)
            ayanamsha = swe.get_ayanamsa_ut(jd)

            cusps, ascmc = swe.houses_ex(jd, lat, lon, b"P", swe.FLG_SIDEREAL)
            asc_deg = ascmc[0]

            swe_p = {1: swe.SUN, 2: swe.MOON, 3: swe.MARS, 4: swe.MERCURY, 5: swe.JUPITER, 6: swe.VENUS, 7: swe.SATURN}
            planets, speeds = {0: asc_deg}, {0: 0.0}
            flags = swe.FLG_SIDEREAL | swe.FLG_SPEED

            for p_id, s_id in swe_p.items():
                pos, _ = swe.calc_ut(jd, s_id, flags)
                planets[p_id], speeds[p_id] = pos[0], pos[3]

            rahu_pos, _ = swe.calc_ut(jd, swe.TRUE_NODE, flags)
            planets[8], planets[9] = rahu_pos[0], (rahu_pos[0] + 180) % 360
            speeds[8] = speeds[9] = 0.0

            names = {0: "ASC", 1: "SUN", 2: "MOON", 3: "MARS", 4: "MERC", 5: "JUP", 6: "VEN", 7: "SAT", 8: "RAHU", 9: "KETU"}
            sym_map = {0: "ල", 1: "ර", 2: "ස", 3: "කු", 4: "බු", 5: "ගු", 6: "සි", 7: "ශ", 8: "රා", 9: "කේ"}
            signs_en = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
            signs_si = ["මේෂ", "වෘෂභ", "මිථුන", "කටක", "සිංහ", "කන්‍යා", "තුලා", "වෘශ්චික", "ධනු", "මකර", "කුම්භ", "මීන"]
            dasha_lords = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
            dasha_years = [7, 20, 6, 10, 7, 18, 16, 19, 17]

            def get_d1(deg): return int(deg / 30) + 1

            # --- 1. D1 (LAGNA) & D9 (NAVAMSHA) MAPPING FOR 3D WHEELS ---
            asc_s = get_d1(asc_deg)
            lagna_planets = {i: [] for i in range(1, 13)}

            for p_id, deg in planets.items():
                p_s = get_d1(deg)
                h_num = ((p_s - asc_s) % 12) + 1
                lagna_planets[h_num].append(sym_map[p_id])

            nav_start = {1:1, 5:1, 9:1, 2:10, 6:10, 10:10, 3:7, 7:7, 11:7, 4:4, 8:4, 12:4}
            def get_d9(deg):
                s_idx = get_d1(deg)
                pada = int((deg % 30) / (30.0 / 9.0))
                return ((nav_start[s_idx] - 1 + pada) % 12) + 1

            asc_d9 = get_d9(asc_deg)
            navamsha_planets = {i: [] for i in range(1, 13)}

            for p_id, deg in planets.items():
                p_d9 = get_d9(deg)
                d9_h_num = ((p_d9 - asc_d9) % 12) + 1
                navamsha_planets[d9_h_num].append(sym_map[p_id])

            # --- 2. PANCHANGA ---
            moon_deg, sun_deg = planets[2], planets[1]
            nak_span = 360 / 27
            moon_nak_idx = int(moon_deg / nak_span)
            pada = int((moon_deg % nak_span) / (360 / 108)) + 1
            tithi_idx = int(((moon_deg - sun_deg) % 360) / 12) + 1
            tithi_paksha = "Shukla (Waxing)" if tithi_idx <= 15 else "Krishna (Waning)"
            karana_idx = int(((moon_deg - sun_deg) % 360) / 6) + 1
            yoga_idx = int(((moon_deg + sun_deg) % 360) / (360/27)) + 1

            nakshatra_table = [("Ashwini", "Horse", "Deva", "Adhi"), ("Bharani", "Elephant", "Manushya", "Madhya"), ("Krittika", "Goat", "Rakshasa", "Antya"), ("Rohini", "Serpent", "Manushya", "Antya"), ("Mrigashira", "Serpent", "Deva", "Madhya"), ("Ardra", "Dog", "Manushya", "Adhi"), ("Punarvasu", "Cat", "Deva", "Adhi"), ("Pushya", "Goat", "Deva", "Madhya"), ("Ashlesha", "Cat", "Rakshasa", "Antya"), ("Magha", "Rat", "Rakshasa", "Antya"), ("Purva Phalguni", "Rat", "Manushya", "Madhya"), ("Uttara Phalguni", "Cow", "Manushya", "Adhi"), ("Hasta", "Buffalo", "Deva", "Adhi"), ("Chitra", "Tiger", "Rakshasa", "Madhya"), ("Swati", "Buffalo", "Deva", "Antya"), ("Vishakha", "Tiger", "Rakshasa", "Antya"), ("Anuradha", "Deer", "Deva", "Madhya"), ("Jyeshta", "Deer", "Rakshasa", "Adhi"), ("Mula", "Dog", "Rakshasa", "Adhi"), ("Purva Ashadha", "Monkey", "Manushya", "Madhya"), ("Uttara Ashadha", "Mongoose", "Manushya", "Antya"), ("Shravana", "Monkey", "Deva", "Antya"), ("Dhanishta", "Lion", "Rakshasa", "Madhya"), ("Shatabhisha", "Horse", "Rakshasa", "Adhi"), ("Purva Bhadrapada", "Lion", "Manushya", "Adhi"), ("Uttara Bhadrapada", "Cow", "Manushya", "Madhya"), ("Revati", "Elephant", "Deva", "Antya")]
            nak_name, yoni, gana, nadi = nakshatra_table[moon_nak_idx]

            # --- 3. YOGAS & DIGNITY ---
            exalted = {1: 1, 2: 2, 3: 10, 4: 6, 5: 4, 6: 12, 7: 7}
            debilitated = {1: 7, 2: 8, 3: 4, 4: 12, 5: 10, 6: 6, 7: 1}
            own_house = {1: [5], 2: [4], 3: [1, 8], 4: [3, 6], 5: [9, 12], 6: [2, 7], 7: [10, 11]}
            yogas_detected = []

            for p_id in range(1, 8):
                s_idx = get_d1(planets[p_id])
                dignity = "Neutral"
                if s_idx == exalted.get(p_id): dignity = "EXALTED"
                elif s_idx == debilitated.get(p_id): dignity = "DEBILITATED"
                elif s_idx in own_house.get(p_id, []): dignity = "OWN HOUSE"

                if ((s_idx - asc_s) % 12 + 1) in [1, 4, 7, 10] and ("EXALTED" in dignity or "OWN" in dignity):
                    if p_id == 3: yogas_detected.append("Ruchaka Yoga")
                    if p_id == 4: yogas_detected.append("Bhadra Yoga")
                    if p_id == 5: yogas_detected.append("Hamsa Yoga")
                    if p_id == 6: yogas_detected.append("Malavya Yoga")
                    if p_id == 7: yogas_detected.append("Shasha Yoga")

            # --- 4. SPECIAL LAGNAS ---
            lord_map = {1:3, 2:6, 3:4, 4:2, 5:1, 6:4, 7:6, 8:3, 9:5, 10:7, 11:7, 12:5}
            kalas = {1:30, 2:16, 3:6, 4:8, 5:10, 6:12, 7:1}
            moon_s = get_d1(planets[2])
            indu_lagna = (moon_s + ((kalas[lord_map[(asc_s+8)%12+1]] + kalas[lord_map[(moon_s+8)%12+1]]) % 12 or 12) - 1) % 12 or 12

            al_sign = (get_d1(planets[lord_map[asc_s]]) + (get_d1(planets[lord_map[asc_s]]) - asc_s)%12) % 12 or 12
            if al_sign == asc_s: al_sign = (al_sign + 9) % 12 or 12
            elif al_sign == ((asc_s + 6)%12 or 12): al_sign = (al_sign + 3) % 12 or 12

            # --- 5. SAV 337 BINDUS ---
            sav = [0] * 12
            bav_rules = {
                1: {1: [1,2,4,7,8,9,10,11], 2: [3,6,10,11], 3: [1,2,4,7,8,9,10,11], 4: [3,5,6,9,10,11,12], 5: [5,6,9,11], 6: [6,7,12], 7: [1,2,4,7,8,9,10,11], 0: [3,4,6,10,11,12]},
                2: {1: [3,6,7,8,10,11], 2: [1,3,6,7,10,11], 3: [2,3,5,6,9,10,11], 4: [1,3,4,5,7,8,10,11], 5: [1,4,7,8,10,11,12], 6: [3,4,5,7,9,10,11], 7: [3,5,6,11], 0: [3,6,10,11]},
                3: {1: [3,5,6,10,11], 2: [3,6,11], 3: [1,2,4,7,8,10,11], 4: [3,5,6,11], 5: [6,10,11,12], 6: [6,8,9,11,12], 7: [1,4,7,8,10,11], 0: [1,3,6,10,11]},
                4: {1: [5,6,9,11,12], 2: [2,4,6,8,10,11], 3: [1,2,4,7,8,9,10,11], 4: [1,3,5,6,9,10,11,12], 5: [6,8,11,12], 6: [1,2,3,4,5,8,9,11], 7: [1,2,4,7,8,9,10,11], 0: [1,2,4,6,8,10,11]},
                5: {1: [1,2,3,4,7,8,9,10,11], 2: [2,5,7,9,11], 3: [1,2,4,7,8,10,11], 4: [1,2,4,5,6,9,10,11], 5: [1,2,3,4,7,8,10,11], 6: [2,5,6,9,10,11], 7: [3,5,6,12], 0: [1,2,4,5,6,7,9,10,11]},
                6: {1: [8,11,12], 2: [1,2,3,4,5,8,9,11,12], 3: [3,4,5,6,9,11,12], 4: [3,5,6,9,11], 5: [5,8,9,10,11], 6: [1,2,3,4,5,8,9,10,11], 7: [3,5,8,9,10,11], 0: [1,2,3,4,5,8,9,11]},
                7: {1: [1,2,4,7,8,10,11], 2: [3,6,11], 3: [3,5,6,10,11,12], 4: [6,8,9,10,11,12], 5: [5,6,11,12], 6: [6,11,12], 7: [3,5,6,11], 0: [1,3,4,6,10,11]},
            }
            for p in range(1, 8):
                for ref_p, points in bav_rules[p].items():
                    ref_s = get_d1(planets[ref_p])
                    for pt in points:
                        sav[(ref_s + pt - 2) % 12] += 1

            sav_house_map = {f"House_{h:02d}": sav[(asc_s + h - 2) % 12] for h in range(1, 13)}

            # --- 6. SPOUSE PREDICTION ---
            seventh_house_idx = (asc_s + 5) % 12 + 1
            seventh_lord_id = lord_map[seventh_house_idx]
            dir_map = {1:"East", 2:"South", 3:"West", 4:"North", 5:"East", 6:"South", 7:"West", 8:"North", 9:"East", 10:"South", 11:"West", 12:"North"}
            spouse_dir = dir_map[get_d1(planets[seventh_lord_id])]

            sl_nak_idx = int(planets[seventh_lord_id] / nak_span)
            sl_pada = int((planets[seventh_lord_id] % nak_span) / (360/108)) + 1
            nama_akshara = [["Chu","Che","Cho","La"], ["Li","Lu","Le","Lo"], ["A","I","U","E"], ["O","Va","Vi","Vu"], ["Ve","Vo","Ka","Ki"], ["Ku","Gha","Ng","Chha"], ["Ke","Ko","Ha","Hi"], ["Hu","He","Ho","Da"], ["Di","Du","De","Do"], ["Ma","Mi","Mu","Me"], ["Mo","Ta","Ti","Tu"], ["Te","To","Pa","Pi"], ["Pu","Sha","Na","Tha"], ["Pe","Po","Ra","Ri"], ["Ru","Re","Ro","Ta"], ["Ti","Tu","Te","To"], ["Na","Ni","Nu","Ne"], ["No","Ya","Yi","Yu"], ["Ye","Yo","Bha","Bhi"], ["Bhu","Dha","Bha","Dha"], ["Bhe","Bho","Ja","Ji"], ["Ju","Je","Jo","Gha"], ["Ga","Gi","Gu","Ge"], ["Go","Sa","Si","Su"], ["Se","So","Da","Di"], ["Du","Tha","Jha","Na"], ["De","Do","Cha","Chi"]]
            spouse_letter = nama_akshara[sl_nak_idx][sl_pada - 1]

            # --- 7. VIMSHOTTARI DASHA TRACKER ---
            bal_y = (1 - ((planets[2] % nak_span) / nak_span)) * dasha_years[moon_nak_idx % 9]
            now = datetime.now(timezone.utc)
            c_date, d_end = now.date(), date(year, month, day) + timedelta(days=bal_y*365.25)
            c_idx = moon_nak_idx % 9
            while c_date > d_end:
                c_idx = (c_idx + 1) % 9
                d_end += timedelta(days=dasha_years[c_idx] * 365.25)
            md_strt = d_end - timedelta(days=dasha_years[c_idx] * 365.25)

            ad_strt, ad_idx = md_strt, c_idx
            for _ in range(9):
                ad_end = ad_strt + timedelta(days=(dasha_years[c_idx]*dasha_years[ad_idx]/120)*365.25)
                if ad_strt <= c_date <= ad_end: break
                ad_strt, ad_idx = ad_end, (ad_idx + 1) % 9

            # PACK COMPLETE REPORT FOR DETAILED DISPLAY BELOW CHART
            v12_report = {
                "client": client_name,
                "ayanamsha": round(ayanamsha, 4),
                "nakshatra": f"{nak_name} (Pada {pada})",
                "nakshatra_lord": dasha_lords[moon_nak_idx % 9],
                "yoni": yoni, "gana": gana, "nadi": nadi,
                "tithi": f"{tithi_idx} ({tithi_paksha})",
                "yogas": yogas_detected if yogas_detected else ["Standard Configuration"],
                "special_lagnas": {
                    "indu_lagna": signs_en[indu_lagna-1],
                    "arudha_lagna": signs_en[al_sign-1]
                },
                "sav_bindus": sav_house_map,
                "spouse_info": {
                    "seventh_lord": names[seventh_lord_id],
                    "direction": spouse_dir,
                    "first_letter": spouse_letter
                },
                "current_dasha": {
                    "maha_dasha": dasha_lords[c_idx],
                    "antar_dasha": dasha_lords[ad_idx]
                }
            }

            response_data = {
                "status": "success",
                "lagna": f"{signs_si[asc_s-1]}<br>ලග්නය",
                "navamsha": f"{signs_si[asc_d9-1]}<br>නවාංශකය",
                "lagna_planets": lagna_planets,
                "navamsha_planets": navamsha_planets,
                "v12_report": v12_report
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
