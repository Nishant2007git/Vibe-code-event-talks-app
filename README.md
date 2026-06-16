# BigQuery Release Pulse 📡

A premium, modern web dashboard for tracking and sharing Google Cloud BigQuery Release Notes. Built with Python Flask, HTML5, Vanilla CSS (Glassmorphism), and Vanilla JavaScript.

## Features 🚀

- **Live RSS Fetching**: Dynamically fetches the official Google Cloud BigQuery Release Notes feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
- **Atomic Splitting**: Automatically parses daily entries and separates individual updates by type (Features, Issues, Deprecations, General).
- **Interactive UI**:
  - **Sleek Dark Mode**: Designed with slate dark backdrops, glowing cyber-gradients, and smooth hover animations.
  - **Toolbar Filtering**: Search release notes by keyword or filter by update type (Feature, Issue, Deprecation, Update).
  - **Toggleable Sort**: Instantly switch between *Newest First* and *Oldest First* ordering.
  - **Pulsing Skeleton Loader**: Beautiful transition state while fetching live updates.
  - **Interactive Highlight**: Highlight cards to mark them as selected.
- **X/Twitter Integration**:
  - Click **Tweet** on any card to open a custom composer modal.
  - Generates a pre-truncated post draft (fitting within X's 280-character limit) complete with details and the direct link.
  - Add or remove quick-action hashtags (`#BigQuery`, `#GoogleCloud`, `#GCP`, `#DataEngineering`) with a single click.
  - Smart character counter that accounts for X's URL shortening mechanism (counting links as exactly 23 characters).
- **Toast Notifications**: Built-in dynamic alerts for action feedbacks.

## File Structure 📁

- [app.py](file:///C:/Users/nisha/agy-cli-projects/app.py): The Flask server backend that fetches, parses, and serves the notes API.
- [templates/index.html](file:///C:/Users/nisha/agy-cli-projects/templates/index.html): Clean HTML template including stats cards, modals, and templates.
- [static/css/style.css](file:///C:/Users/nisha/agy-cli-projects/static/css/style.css): Vanilla CSS containing design tokens, animations, skeleton loaders, and responsive layout.
- [static/js/app.js](file:///C:/Users/nisha/agy-cli-projects/static/js/app.js): Vanilla JavaScript implementing the feed integration, UI filters, tweet composer, hashtag helpers, and toast system.

## Setup & Running ⚙️

### Prerequisites
Make sure Python 3.x is installed. The application depends on `flask`, `requests`, and `beautifulsoup4` (which are already pre-installed).

### Running the server
Start the Flask application by running:
```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```
