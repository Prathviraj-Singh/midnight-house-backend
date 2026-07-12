from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# Local PostgreSQL database setup (Task TSK-1.2)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'midnight_house_db'),
        'USER': os.environ.get('DB_USER', 'midnight_admin'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'secure_db_password'),
        'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# CORS configuration
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS', 
    'http://localhost:3000,http://127.0.0.1:3000'
).split(',')

# SimpleJWT Base local parameters configured in base.py

