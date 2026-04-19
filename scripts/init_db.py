#!/usr/bin/env python3
"""Initialize the bot database."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from bot.db.database import init_db

if __name__ == '__main__':
    init_db()
    print("Done. Database is ready.")
