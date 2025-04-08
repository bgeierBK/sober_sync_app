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

    existing_events = {(event.name, event.date) for event in Event.query.all()}  # Get existing event (name, date) pairs

    new_events = []
    for event in events_data['data']:
        try:
            venue = event.get("venue", {})
            city = venue.get("location", "Unknown City")
            if not isinstance(city, str) or "NY" not in city:
                continue  # Skip events not in NYC

            event_name = event.get("name", "Unnamed Event") or "Unnamed Event"
            if event_name == "Unnamed Event":
                continue  # Skip unnamed events

            event_date = event.get("date", "Unknown Date")
            venue_name = venue.get("name", "Unknown Location") or "Unknown Location"

            photo_url = event.get("photo")  # This can be None

            if (event_name, event_date) not in existing_events:  # Avoid duplicates
                new_events.append(Event(
                    name=event_name.strip(),
                    date=event_date,
                    venue_name=venue_name.strip(),
                    city=city.strip(),
                    photo=photo_url  # This will be None if not present
                ))

        except Exception as e:
            print(f"Error processing event: {event.get('name', 'Unnamed Event')}. Error: {str(e)}")
            continue

    if new_events:
        db.session.add_all(new_events)
        db.session.commit()
        print(f"{len(new_events)} new events successfully added.")
    else:
        print("No new events to add.")

