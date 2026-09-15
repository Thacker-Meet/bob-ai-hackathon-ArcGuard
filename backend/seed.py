"""Deterministic, fictional demonstration data. Never use as a clinical protocol."""
from datetime import date, timedelta

AS_OF = '2026-09-15'
PROTOCOL = {
    'id': 'DEMO-ARC-01', 'version': '1.0', 'effectiveDate': '2026-01-01',
    'visitWindowDays': 3, 'doseMg': 50, 'doseToleranceMg': 0,
    'bannedMedications': ['DEMO-MED-X', 'DEMO-MED-Y'],
    'severity': {'wrong_dose': 'major', 'banned_medication': 'major',
                 'missed_visit': 'minor', 'visit_window': 'minor', 'documentation': 'administrative'},
    'references': {'wrong_dose': 'Demo §6.1', 'banned_medication': 'Demo §6.3',
                   'missed_visit': 'Demo §5.2', 'visit_window': 'Demo §5.2', 'documentation': 'Demo §8.1'},
}

def make_seed():
    sites, visits = [], []
    cities = ['Boston', 'Chicago', 'Atlanta', 'Seattle', 'Phoenix', 'London', 'Berlin', 'Mumbai', 'Toronto', 'Madrid', 'Sydney', 'Paris']
    for i in range(204):
        site_id = f'SITE-{101+i:03}'
        pressure = [1, .82, .64, .4, .18][i] if i < 5 else (i % 9) / 60
        sites.append({'id': site_id, 'name': cities[i % len(cities)], 'region': ['North America', 'Europe', 'Asia Pacific'][i % 3],
                      'openQueries': 10, 'overdueQueries': round(10*pressure), 'staffCount': 10,
                      'untrainedStaff': round(10*pressure), 'signalsUpdatedAt': AS_OF})
        for j in range(26):
            scheduled = date.fromisoformat(AS_OF) + timedelta(days=(j-20)*2)
            actual = scheduled if j <= 20 else None
            dose, meds, documented = 50, [], True
            if i < 5 and j < (5-i)*2:
                if j % 4 == 0: dose = 75
                elif j % 4 == 1: meds = ['DEMO-MED-X']
                elif j % 4 == 2: actual = None
                else: actual = scheduled + timedelta(days=4)
            elif i % 13 == 0 and j == 3: documented = False
            if i % 17 == 0 and j == 8: dose = None
            visits.append({'id': f'V-{i+1:03}-{j+1:02}', 'participantId': f'PT-{i*13+j//2+1:04}',
                           'siteId': site_id, 'scheduledDate': scheduled.isoformat(),
                           'actualDate': actual.isoformat() if actual else None, 'doseMg': dose if actual else None,
                           'medications': meds if actual else None, 'documented': documented if actual else None,
                           'confirmed': j <= 20 or (j-21)/5 >= pressure,
                           'updatedAt': AS_OF})
    return {'sites': sites, 'visits': visits}
