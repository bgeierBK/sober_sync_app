import requests
import os
from server.models import Event
from server.extensions import db
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

EDMTRAIN_API_KEY = os.getenv("EDMTRAIN_API_KEY")
EDMTRAIN_LOCATION_API_URL = os.getenv("EDMTRAIN_LOCATION_API_URL")
EDMTRAIN_EVENTS_API_URL = os.getenv("EDMTRAIN_EVENTS_API_URL")

def get_nyc_location_ids():    
    params = {
        "state": "New York",
        "city": "New York",
        "client": EDMTRAIN_API_KEY
    }
    
    response = requests.get(EDMTRAIN_LOCATION_API_URL, params=params)
    
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

def fetch_and_add_edmtrain_events():
    location_ids = get_nyc_location_ids()
    if not location_ids:
        print("No location IDs found for NYC.")
        return

    location_id_string = ",".join(map(str, location_ids))

    params = {
        "client": EDMTRAIN_API_KEY,
        "locationIds": location_id_string
    }

    response = requests.get(EDMTRAIN_EVENTS_API_URL, params=params)
    
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
                    photo=photo_url,  # This will be None if not present
                    source="EDMTrain"  # Adding source identifier
                ))

        except Exception as e:
            print(f"Error processing event: {event.get('name', 'Unnamed Event')}. Error: {str(e)}")
            continue

    if new_events:
        db.session.add_all(new_events)
        db.session.commit()
        print(f"{len(new_events)} new EDMTrain events successfully added.")
    else:
        print("No new EDMTrain events to add.")

# def fetch_and_add_eventbrite_events():
#     # Eventbrite API configuration
#     EVENTBRITE_API_URL = "https://www.eventbriteapi.com/v3/events/search/"
#     EVENTBRITE_API_KEY = os.getenv(EVENTBRITE_API_KEY)
    
#     headers = {
#         "Authorization": f"Bearer {EVENTBRITE_API_KEY}"
#     }
    
#     # Current date and date 3 months from now for search range
#     start_date = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
#     end_date = (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%dT%H:%M:%SZ")
    
#     # Parameters for music events in NYC
#     params = {
#         "location.address": "New York, NY",
#         "location.within": "20mi",
#         "categories": "103",  # Music category ID in Eventbrite
#         "start_date.range_start": start_date,
#         "start_date.range_end": end_date,
#         "page_size": 100  # Max page size
#     }
    
#     existing_events = {(event.name, event.date) for event in Event.query.all()}
#     new_events = []
    
#     try:
#         # Pagination handling - Eventbrite limits results per page
#         has_more_items = True
#         continuation_token = None
#         page_count = 1
        
#         while has_more_items and page_count <= 5:  # Limit to 5 pages to avoid excessive API calls
#             if continuation_token:
#                 params["continuation"] = continuation_token
                
#             response = requests.get(EVENTBRITE_API_URL, headers=headers, params=params)
            
#             if response.status_code != 200:
#                 print(f"Error: Received status code {response.status_code} from Eventbrite API.")
#                 print(f"Response: {response.text}")
#                 break
                
#             events_data = response.json()
            
#             for event in events_data.get("events", []):
#                 try:
#                     event_name = event.get("name", {}).get("text", "Unnamed Event")
#                     if not event_name or event_name == "Unnamed Event":
#                         continue
                    
#                     # Convert event date to match your existing format
#                     event_date_str = event.get("start", {}).get("utc")
#                     if event_date_str:
#                         event_date = event_date_str.split("T")[0]  # Extract YYYY-MM-DD
#                     else:
#                         continue  # Skip events without a date
                    
#                     # Get venue information
#                     venue_id = event.get("venue_id")
#                     venue_name = "Unknown Location"
#                     city = "New York, NY"
                    
#                     if venue_id:
#                         venue_url = f"https://www.eventbriteapi.com/v3/venues/{venue_id}/"
#                         venue_response = requests.get(venue_url, headers=headers)
#                         if venue_response.status_code == 200:
#                             venue_data = venue_response.json()
#                             venue_name = venue_data.get("name", "Unknown Location")
#                             address = venue_data.get("address", {})
#                             city = f"{address.get('city', 'New York')}, {address.get('region', 'NY')}"
                    
#                     # Get image URL
#                     photo_url = None
#                     if event.get("logo") and event["logo"].get("url"):
#                         photo_url = event["logo"]["url"]
                    
#                     # Check for duplicates
#                     if (event_name, event_date) not in existing_events:
#                         new_events.append(Event(
#                             name=event_name.strip(),
#                             date=event_date,
#                             venue_name=venue_name.strip(),
#                             city=city.strip(),
#                             photo=photo_url,
#                             source="Eventbrite",  # Add source identifier
#                             external_id=event.get("id")  # Store Eventbrite ID for reference
#                         ))
                        
#                 except Exception as e:
#                     print(f"Error processing Eventbrite event: {event.get('name', {}).get('text', 'Unnamed')}. Error: {str(e)}")
#                     continue
            
#             # Check for continuation
#             continuation_token = events_data.get("pagination", {}).get("continuation")
#             has_more_items = bool(continuation_token)
#             page_count += 1
            
#     except Exception as e:
#         print(f"Error fetching Eventbrite events: {str(e)}")
    
#     if new_events:
#         db.session.add_all(new_events)
#         db.session.commit()
#         print(f"{len(new_events)} new Eventbrite events successfully added.")
#     else:
#         print("No new Eventbrite events to add.")

def fetch_and_add_events():
    """Main function to fetch and add events from all sources"""
    fetch_and_add_edmtrain_events()
    # fetch_and_add_eventbrite_events()