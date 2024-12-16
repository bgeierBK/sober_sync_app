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
    
    # Get location IDs for NYC
    location_ids = get_nyc_location_ids()  # This will return a list of location IDs for NYC
    
    if not location_ids:
        print("No location IDs found for NYC.")
        return

    LOCATION_IDS = ",".join(map(str, location_ids))  # Join list of IDs as a comma-separated string

    params = {
        "client": API_KEY,
        "location_ids": LOCATION_IDS
    }

    response = requests.get(API_URL, params=params)
    
    # Log raw response for debugging
    print("Raw API response:", response.text)

    # Check if the request was successful
    if response.status_code != 200:
        print(f"Error: Received status code {response.status_code} from API.")
        return

    # Try to parse the response as JSON
    try:
        events_data = response.json()
        if not events_data or 'data' not in events_data:
            print("No events found.")
            return
    except requests.exceptions.JSONDecodeError:
        print(f"Error: Failed to decode JSON from response: {response.text}")
        return

    # Processing the events data
    for event in events_data['data']:
        try:
            # Log the event data to inspect its structure
            print("Processing event:", event)

            # Skip event if it's a string or None
            if isinstance(event, str) or event is None:
                print(f"Skipping event because it's a string or None: {event}")
                continue  # Skip if event is a string or None

            # Check if 'name' is None or missing and set a default
            event_name = event.get("name") if event.get("name") else "Unnamed Event"

            venue = event.get("venue", {})
            
            # Ensure venue is a dictionary, otherwise use fallback
            if isinstance(venue, dict):
                venue_name = venue.get("name", "Unknown Location")
                city = venue.get("location", "Unknown City")
            elif isinstance(venue, str):  # If venue is a string, treat it as the venue name
                venue_name = venue
                city = "Unknown City"
            else:  # Fallback for unexpected cases
                venue_name = "Unknown Location"
                city = "Unknown City"

            # Assuming Event model has the fields name, city, etc.
            new_event = Event(
                name=event_name,
                date=event.get("date", "Unknown Date"),
                venue_name=venue_name,
                city=city
            )
            db.session.add(new_event)
            db.session.commit()

        except Exception as e:
            print(f"Error processing event: {event_name}. Error: {str(e)}")
            continue  # Continue to next event even if one fails

    print("Events successfully added.")
