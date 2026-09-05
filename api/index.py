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

            client_name = data.get('name', 'Client')
            year = int(data.get('year', 1990))
            month = int(data.get('month', 1))
            day = int(data.get('day', 1))
            hour = int(data.get('hour', 12))
            minute = int(data.get('minute', 0))
            lat = float(data.get('lat', 6.9271))
            lon = float(data.get('lon', 79.8612))

            decimal_hour = hour + (minute / 60.0)
            tz = get_sri_lankan_historical_tz(year, month, day)
            utc_hour = decimal_hour - tz

            swe.set_sid_mode(swe.SIDM_LAHIRI)
            jd = swe.julday(year, month, day, utc_hour)
            ayanamsha = swe.get_ayanamsa_ut(jd)

            # Force built-in Moshier Ephemeris
            flags = swe.FLG_SIDEREAL | swe.FLG_SPEED | swe.FLG_MOSEPH

            cusps, ascmc = swe.houses_ex(jd, lat, lon, b"P", flags)
            asc_deg = ascmc[0]

            swe_p = {1: swe.SUN, 2: swe.MOON, 3: swe.MARS, 4: swe.MERCURY, 5: swe.JUPITER, 6: swe.VENUS, 7: swe.SATURN}
            planets, speeds = {0: asc_deg}, {0: 0.0}

            for p_id, s_id in swe_p.items():
                pos, _ = swe.calc_ut(jd, s_id, flags)
                planets[p_id], speeds[p_id] = pos[0], pos[3]

            rahu_pos, _ = swe.calc_ut(jd, swe.MEAN_NODE, flags)
            planets[8], planets[9] = rahu_pos[0], (rahu_pos[0] + 180) % 360
            speeds[8] = speeds[9] = 0.0

            sym_map = {0: "ල", 1: "ර", 2: "ස", 3: "කු", 4: "බු", 5: "ගු", 6: "සි", 7: "ශ", 8: "රා", 9: "කේ"}
            names_en = {0: "ASC", 1: "SUN", 2: "MOON", 3: "MARS", 4: "MERC", 5: "JUP", 6: "VEN", 7: "SAT", 8: "RAHU", 9: "KETU"}
            signs_en = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
            signs_si = ["මේෂ", "වෘෂභ", "මිථුන", "කටක", "සිංහ", "කන්‍යා", "තුලා", "වෘශ්චික", "ධනු", "මකර", "කුම්භ", "මීන"]
            dasha_lords = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
            dasha_years = [7, 20, 6, 10, 7, 18, 16, 19, 17]

            def get_d1(deg): return int(deg / 30) + 1

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

            # Panchanga
            moon_deg, sun_deg = planets[2], planets[1]
            nak_span = 360 / 27
            moon_nak_idx = int(moon_deg / nak_span)
            pada = int((moon_deg % nak_span) / (360 / 108)) + 1
            tithi_idx = int(((moon_deg - sun_deg) % 360) / 12) + 1
            tithi_paksha = "Shukla (Waxing)" if tithi_idx <= 15 else "Krishna (Waning)"

            nakshatra_table = [("Ashwini", "Horse", "Deva", "Adhi"), ("Bharani", "Elephant", "Manushya", "Madhya"), ("Krittika", "Goat", "Rakshasa", "Antya"), ("Rohini", "Serpent", "Manushya", "Antya"), ("Mrigashira", "Serpent", "Deva", "Madhya"), ("Ardra", "Dog", "Manushya", "Adhi"), ("Punarvasu", "Cat", "Deva", "Adhi"), ("Pushya", "Goat", "Deva", "Madhya"), ("Ashlesha", "Cat", "Rakshasa", "Antya"), ("Magha", "Rat", "Rakshasa", "Antya"), ("Purva Phalguni", "Rat", "Manushya", "Madhya"), ("Uttara Phalguni", "Cow", "Manushya", "Adhi"), ("Hasta", "Buffalo", "Deva", "Adhi"), ("Chitra", "Tiger", "Rakshasa", "Madhya"), ("Swati", "Buffalo", "Deva", "Antya"), ("Vishakha", "Tiger", "Rakshasa", "Antya"), ("Anuradha", "Deer", "Deva", "Madhya"), ("Jyeshta", "Deer", "Rakshasa", "Adhi"), ("Mula", "Dog", "Rakshasa", "Adhi"), ("Purva Ashadha", "Monkey", "Manushya", "Madhya"), ("Uttara Ashadha", "Mongoose", "Manushya", "Antya"), ("Shravana", "Monkey", "Deva", "Antya"), ("Dhanishta", "Lion", "Rakshasa", "Madhya"), ("Shatabhisha", "Horse", "Rakshasa", "Adhi"), ("Purva Bhadrapada", "Lion", "Manushya", "Adhi"), ("Uttara Bhadrapada", "Cow", "Manushya", "Madhya"), ("Revati", "Elephant", "Deva", "Antya")]
            nak_name, yoni, gana, nadi = nakshatra_table[moon_nak_idx]

            # Yogas
            exalted = {1: 1, 2: 2, 3: 10, 4: 6, 5: 4, 6: 12, 7: 7}
            own_house = {1: [5], 2: [4], 3: [1, 8], 4: [3, 6], 5: [9, 12], 6: [2, 7], 7: [10, 11]}
            yogas_detected = []
            for p_id in range(1, 8):
                s_idx = get_d1(planets[p_id])
                if ((s_idx - asc_s) % 12 + 1) in [1, 4, 7, 10] and (s_idx == exalted.get(p_id) or s_idx in own_house.get(p_id, [])):
                    if p_id == 3: yogas_detected.append("Ruchaka Yoga")
                    if p_id == 4: yogas_detected.append("Bhadra Yoga")
                    if p_id == 5: yogas_detected.append("Hamsa Yoga")
                    if p_id == 6: yogas_detected.append("Malavya Yoga")
                    if p_id == 7: yogas_detected.append("Shasha Yoga")

            lord_map = {1:3, 2:6, 3:4, 4:2, 5:1, 6:4, 7:6, 8:3, 9:5, 10:7, 11:7, 12:5}
            kalas = {1:30, 2:16, 3:6, 4:8, 5:10, 6:12, 7:1}
            moon_s = get_d1(planets[2])
            indu_lagna = (moon_s + ((kalas[lord_map[(asc_s+8)%12+1]] + kalas[lord_map[(moon_s+8)%12+1]]) % 12 or 12) - 1) % 12 or 12

            al_sign = (get_d1(planets[lord_map[asc_s]]) + (get_d1(planets[lord_map[asc_s]]) - asc_s)%12) % 12 or 12
            if al_sign == asc_s: al_sign = (al_sign + 9) % 12 or 12

            h12_s = (asc_s + 10) % 12 + 1
            ul_sign = (get_d1(planets[lord_map[h12_s]]) + (get_d1(planets[lord_map[h12_s]]) - h12_s)%12) % 12 or 12
            if ul_sign == h12_s: ul_sign = (ul_sign + 9) % 12 or 12

            # SAV Bindus
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

            sav_total = sum(sav)
            wealth_score = min(98, max(68, int((sav_total / 337.0) * 100 + 15)))

            # Spouse Info
            seventh_house_idx = (asc_s + 5) % 12 + 1
            seventh_lord_id = lord_map[seventh_house_idx]
            dir_map = {1:"East", 2:"South", 3:"West", 4:"North", 5:"East", 6:"South", 7:"West", 8:"North", 9:"East", 10:"South", 11:"West", 12:"North"}
            spouse_dir = dir_map[get_d1(planets[seventh_lord_id])]

            sl_nak_idx = int(planets[seventh_lord_id] / nak_span)
            sl_pada = int((planets[seventh_lord_id] % nak_span) / (360/108)) + 1
            nama_akshara = [["Chu","Che","Cho","La"], ["Li","Lu","Le","Lo"], ["A","I","U","E"], ["O","Va","Vi","Vu"], ["Ve","Vo","Ka","Ki"], ["Ku","Gha","Ng","Chha"], ["Ke","Ko","Ha","Hi"], ["Hu","He","Ho","Da"], ["Di","Du","De","Do"], ["Ma","Mi","Mu","Me"], ["Mo","Ta","Ti","Tu"], ["Te","To","Pa","Pi"], ["Pu","Sha","Na","Tha"], ["Pe","Po","Ra","Ri"], ["Ru","Re","Ro","Ta"], ["Ti","Tu","Te","To"], ["Na","Ni","Nu","Ne"], ["No","Ya","Yi","Yu"], ["Ye","Yo","Bha","Bhi"], ["Bhu","Dha","Bha","Dha"], ["Bhe","Bho","Ja","Ji"], ["Ju","Je","Jo","Gha"], ["Ga","Gi","Gu","Ge"], ["Go","Sa","Si","Su"], ["Se","So","Da","Di"], ["Du","Tha","Jha","Na"], ["De","Do","Cha","Chi"]]
            spouse_letter = nama_akshara[sl_nak_idx][sl_pada - 1]

            # Doshas
            now = datetime.now(timezone.utc)
            t_jd = swe.julday(now.year, now.month, now.day, now.hour + now.minute/60.0)
            t_moon = swe.calc_ut(t_jd, swe.MOON, flags)[0][0]
            t_sat = get_d1(swe.calc_ut(t_jd, swe.SATURN, flags)[0][0])
            s_from_m = (t_sat - get_d1(planets[2])) % 12 + 1
            mars_h = (get_d1(planets[3]) - asc_s) % 12 + 1

            kuja_dosha = "YES" if mars_h in [1, 2, 4, 7, 8, 12] else "NO"
            sade_sati = "Sade Sati" if s_from_m in [12, 1, 2] else ("Ashtama Shani" if s_from_m == 8 else "NO")

            tara_idx = (int(t_moon / nak_span) - moon_nak_idx) % 9
            tara_names = ["Janma", "Sampat", "Vipat", "Kshema", "Pratyak", "Sadhaka", "Naidhana", "Mitra", "Parama Mitra"]

            # Dashas Calculation
            bal_y = (1 - ((planets[2] % nak_span) / nak_span)) * dasha_years[moon_nak_idx % 9]
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

            pd_strt, pd_idx = ad_strt, ad_idx
            for _ in range(9):
                pd_end = pd_strt + timedelta(days=(dasha_years[c_idx]*dasha_years[ad_idx]*dasha_years[pd_idx]/14400)*365.25)
                if pd_strt <= c_date <= pd_end: break
                pd_strt, pd_idx = pd_end, (pd_idx + 1) % 9

            # 1. DYNAMIC TRUE ASTROLOGICAL LUCKY FREQUENCY (Lagna Lord Based Solfeggio Frequency)
            lagna_lord_id = lord_map[asc_s]
            freq_map = {
                1: "528Hz (Solar Leadership & Vitality)",       # Sun (Leo)
                2: "432Hz (Chandra Emotional Balance)",         # Moon (Cancer)
                3: "639Hz (Kuja Strength & Willpower)",         # Mars (Aries, Scorpio)
                4: "741Hz (Budha Intellect & Clarity)",         # Mercury (Gemini, Virgo)
                5: "852Hz (Guru Wisdom & Expansion)",           # Jupiter (Sagittarius, Pisces)
                6: "639Hz (Sukra Attraction & Harmony)",        # Venus (Taurus, Libra)
                7: "396Hz (Shani Karma & Grounding)"            # Saturn (Capricorn, Aquarius)
            }
            lucky_freq = freq_map.get(lagna_lord_id, "528Hz (Solar Healing)")

            # 2. DYNAMIC VEDIC DASHA MARRIAGE WINDOW (Based on 7th Lord / Venus / Jupiter Antardashas)
            dasha_id_map = [9, 6, 1, 2, 3, 8, 5, 7, 4]  # Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury
            
            scan_md, scan_ad, scan_date = c_idx, ad_idx, ad_strt
            marriage_found, m_start_year, m_end_year = False, None, None

            for _ in range(27):
                ad_duration_days = (dasha_years[scan_md] * dasha_years[scan_ad] / 120.0) * 365.25
                ad_finish = scan_date + timedelta(days=ad_duration_days)
                
                planet_in_ad = dasha_id_map[scan_ad]
                planet_in_md = dasha_id_map[scan_md]
                
                # Active Antardasha of 7th Lord, Venus (6) or Jupiter (5) after current date
                if (planet_in_ad in [seventh_lord_id, 6, 5] or planet_in_md == seventh_lord_id) and ad_finish >= c_date:
                    m_start_year = max(scan_date, c_date).year
                    m_end_year = ad_finish.year
                    marriage_found = True
                    break
                
                scan_date = ad_finish
                scan_ad = (scan_ad + 1) % 9
                if scan_ad == 0:
                    scan_md = (scan_md + 1) % 9

            if marriage_found and m_start_year:
                marriage_window = f"{m_start_year} - {m_end_year}" if m_start_year != m_end_year else f"{m_start_year} - {m_start_year + 1}"
            else:
                marriage_window = f"{now.year + 1} - {now.year + 3}"

            golden_window = f"{ad_end.strftime('%Y %b')} - {(ad_end + timedelta(days=365*2)).strftime('%Y %b')}"
            karmic_level = "HIGH (Rahu/Ketu Active)" if kuja_dosha == "YES" and sade_sati != "NO" else ("MODERATE (Karmic Trigger)" if kuja_dosha == "YES" or sade_sati != "NO" else "STABLE / CLEAR")

            v12_report = {
                "client": client_name,
                "ayanamsha": f"{ayanamsha:.3f}°",
                "nakshatra": f"{nak_name} (Pada {pada})",
                "nakshatra_lord": dasha_lords[moon_nak_idx % 9],
                "yoni": yoni, "gana": gana, "nadi": nadi,
                "tithi": f"{tithi_idx} ({tithi_paksha})",
                "yogas": yogas_detected if yogas_detected else "Standard Configuration",
                "wealth_potential": f"{wealth_score}% [HIGH]",
                "golden_window": golden_window,
                "marriage_window": marriage_window,
                "soulmate_match": "89% - 94%",
                "karmic_level": karmic_level,
                "lucky_freq": lucky_freq,
                "power_gem": "🔒 LOCKED (In Blueprint)",
                "special_lagnas": {
                    "indu_lagna": signs_en[indu_lagna-1],
                    "arudha_lagna": signs_en[al_sign-1],
                    "upapada_lagna": signs_en[ul_sign-1]
                },
                "sav_total": sav_total,
                "spouse_info": {
                    "seventh_lord": names_en[seventh_lord_id],
                    "direction": spouse_dir,
                    "first_letter": spouse_letter
                },
                "doshas": {
                    "kuja_dosha": kuja_dosha,
                    "sade_sati": sade_sati,
                    "tara_bala": tara_names[tara_idx]
                },
                "current_dasha": {
                    "maha_dasha": dasha_lords[c_idx],
                    "antar_dasha": dasha_lords[ad_idx],
                    "pratyantar_dasha": dasha_lords[pd_idx]
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
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
