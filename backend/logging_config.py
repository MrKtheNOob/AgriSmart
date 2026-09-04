import logging
import os
import sys
from logging.config import dictConfig


def configure_logging() -> None:
    """Configure shared console output for Uvicorn and application services."""
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    if level not in logging.getLevelNamesMapping():
        raise ValueError(f"Invalid LOG_LEVEL: {level}")

    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "stream": sys.stdout,
                }
            },
            "root": {"handlers": ["console"], "level": level},
            "loggers": {
                "uvicorn": {
                    "handlers": ["console"],
                    "level": level,
                    "propagate": False,
                },
                "uvicorn.error": {"level": level},
                "uvicorn.access": {
                    "handlers": ["console"],
                    "level": level,
                    "propagate": False,
                },
            },
        }
    )
