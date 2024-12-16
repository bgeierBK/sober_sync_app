import requests
from server.models import Event
from server.extensions import db


def fetch_and_add_events():
    API_URL = "https://edmtrain.com/api/events"
    API_KEY = "50be9660-3951-4835-9804-03f5728a9e5a"
    LOCATION_IDS = "36,94"  # Replace with actual location IDs for NYC

    # Requesting events for the specified LOCATION_IDS
    params = {
        "api_key": API_KEY,
        "location_ids": LOCATION_IDS
    }
    
    response = requests.get(API_URL, params=params)
    
    # Check if the request was successful
    if response.status_code != 200:
        print(f"Error: Received status code {response.status_code} from API.")
        return

    # Try to parse the response as JSON
    try:
        events_data = response.json()
        if not events_data:
            print("No events found.")
            return
    except requests.exceptions.JSONDecodeError:
        print(f"Error: Failed to decode JSON from response: {response.text}")
        return

    # Processing the events data
    for event in events_data:
        try:
            venue = event.get("venue", {})

            # Check if venue is a dictionary
            if isinstance(venue, dict):
                venue_name = venue.get("name", "Unknown Location")
                city = venue.get("location", {}).get("city", "Unknown City")
            elif isinstance(venue, str):  # If it's a string, use it as the venue name
                venue_name = venue
                city = "Unknown City"
            else:  # Fallback for unexpected cases
                venue_name = "Unknown Location"
                city = "Unknown City"

            # Assuming Event model has the fields name, city, etc.
            new_event = Event(
                name=event.get("name", "Unknown Event"),
                description=event.get("description", "No description"),
                date=event.get("date", "Unknown Date"),
                venue_name=venue_name,
                city=city
            )
            db.session.add(new_event)
            db.session.commit()

        except Exception as e:
            print(f"Error processing event: {event.get('name', 'Unknown')}. Error: {str(e)}")
            continue  # Continue to next event even if one fails

    print("Events successfully added.")

