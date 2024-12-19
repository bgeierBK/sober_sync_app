import requests
from server.models import Event
from server.extensions import db

def get_nyc_location_ids():
    LOCATION_API_URL = "https://edmtrain.com/api/locations"
    API_KEY = "50be9660-3951-4835-9804-03f5728a9e5a"
    
    params = {
        "state": "New York",
        "city": "New York",
        "client": API_KEY
    }
    
    response = requests.get(LOCATION_API_URL, params=params)
    
    if response.status_code != 200:
        print(f"Error: Received status code {response.status_code} from API.")
        return []

    try:
        location_data = response.json()
        location_ids = [location['id'] for location in location_data['data']]
        return location_ids
    except requests.exceptions.JSONDecodeError:
        print(f"Error: Failed to decode JSON from response: {response.text}")
        return []

def fetch_and_add_events():
    API_URL = "https://edmtrain.com/api/events"
    API_KEY = "50be9660-3951-4835-9804-03f5728a9e5a"
    
    location_ids = get_nyc_location_ids()
    if not location_ids:
        print("No location IDs found for NYC.")
        return

    LOCATION_IDS = ",".join(map(str, location_ids))

    params = {
        "client": API_KEY,
        "locationIds": LOCATION_IDS
    }

    response = requests.get(API_URL, params=params)
    
    if response.status_code != 200:
        print(f"Error: Received status code {response.status_code} from API.")
        return

    try:
        events_data = response.json()
        if not events_data or 'data' not in events_data:
            print("No events found.")
            return
    except requests.exceptions.JSONDecodeError:
        print(f"Error: Failed to decode JSON from response: {response.text}")
        return

    # Clear the events table before refilling
    with db.session.begin():
        db.session.query(Event).delete()

    print("Events table cleared.")

    # Add new events
    events = []
    for event in events_data['data']:
        try:
            # Ensure the city contains "NY"
            venue = event.get("venue", {})
            city = venue.get("location", "Unknown City")
            if not isinstance(city, str) or "NY" not in city:
                continue  # Skip events not in NYC

            # Process event data with fallback values
            event_name = event.get("name", "Unnamed Event") or "Unnamed Event"
            venue_name = venue.get("name", "Unknown Location") or "Unknown Location"

            events.append(Event(
                name=event_name.strip() if isinstance(event_name, str) else "Unnamed Event",
                date=event.get("date", "Unknown Date"),
                venue_name=venue_name.strip() if isinstance(venue_name, str) else "Unknown Location",
                city=city.strip() if isinstance(city, str) else "Unknown City"
            ))

        except Exception as e:
            print(f"Error processing event: {event.get('name', 'Unnamed Event')}. Error: {str(e)}")
            continue

    # Bulk insert new events
    with db.session.begin():
        db.session.bulk_save_objects(events)

    print("Events successfully added.")


