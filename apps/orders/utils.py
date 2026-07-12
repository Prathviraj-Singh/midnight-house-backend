"""
Utility functions for the Orders app — delivery distance validation.
"""
import math

# Approximate coordinates of Midnight House — Vijay Nagar, Scheme No. 74, Indore
CAFE_LATITUDE = 22.7533
CAFE_LONGITUDE = 75.8937

MAX_DELIVERY_RADIUS_KM = 5.0


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points (in km) using the Haversine formula."""
    R = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def distance_from_cafe_km(latitude: float, longitude: float) -> float:
    """Distance from the cafe to a given point, in km."""
    return haversine_distance_km(CAFE_LATITUDE, CAFE_LONGITUDE, latitude, longitude)