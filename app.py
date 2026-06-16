import os
import requests
import hashlib
from flask import Flask, jsonify, render_template, request
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache for the release notes
cache = {
    "data": None,
    "etag": None,
    "last_fetched": None
}

def clean_html_text(html_content):
    """Strip HTML tags and clean up whitespace for plain text tweets."""
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, 'html.parser')
    # Replace links with their text and URL if possible, or just keep text
    for a in soup.find_all('a'):
        href = a.get('href', '')
        if href.startswith('/'):
            href = 'https://cloud.google.com' + href
        # If the link text is just the URL or similar, don't duplicate
        if a.get_text() not in href:
            a.replace_with(f"{a.get_text()} ({href})")
        else:
            a.replace_with(a.get_text())
            
    text = soup.get_text(separator=' ')
    # Clean up multiple whitespaces
    text = ' '.join(text.split())
    return text

def parse_release_notes(xml_content):
    """Parse Google Cloud BigQuery Release Notes Atom feed."""
    soup = BeautifulSoup(xml_content, 'xml')
    entries = soup.find_all('entry')
    
    parsed_updates = []
    
    for entry in entries:
        entry_title = entry.find('title')
        entry_date = entry_title.text.strip() if entry_title else "Unknown Date"
        
        entry_link_node = entry.find('link', rel='alternate') or entry.find('link')
        entry_link = entry_link_node['href'] if entry_link_node and 'href' in entry_link_node.attrs else ""
        
        entry_updated_node = entry.find('updated')
        entry_updated = entry_updated_node.text.strip() if entry_updated_node else ""
        
        entry_id_node = entry.find('id')
        entry_id = entry_id_node.text.strip() if entry_id_node else ""
        entry_hash = hashlib.md5(entry_id.encode('utf-8')).hexdigest()[:8]
        
        content_node = entry.find('content')
        if not content_node:
            continue
            
        content_html = content_node.text
        content_soup = BeautifulSoup(content_html, 'html.parser')
        
        # Split entry content by <h3> tags
        current_type = None
        current_elements = []
        entry_updates = []
        
        for element in content_soup.contents:
            if element.name == 'h3':
                if current_type:
                    desc_html = "".join(str(c) for c in current_elements).strip()
                    entry_updates.append((current_type, desc_html))
                current_type = element.get_text().strip()
                current_elements = []
            else:
                if current_type is not None:
                    current_elements.append(element)
                    
        # Append the final parsed part
        if current_type:
            desc_html = "".join(str(c) for c in current_elements).strip()
            entry_updates.append((current_type, desc_html))
            
        # Fallback if no <h3> tags found
        if not entry_updates:
            entry_updates.append(("Update", content_html.strip()))
            
        # Create structured objects
        for idx, (utype, udesc) in enumerate(entry_updates):
            clean_text = clean_html_text(udesc)
            update_id = f"{entry_hash}_{idx}"
            
            parsed_updates.append({
                "id": update_id,
                "date": entry_date,
                "timestamp": entry_updated,
                "link": entry_link,
                "type": utype,
                "description": udesc,
                "plain_text": clean_text
            })
            
    return parsed_updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    if force_refresh or cache["data"] is None:
        try:
            # Fetch fresh content from Google
            headers = {}
            if cache["etag"] and not force_refresh:
                headers['If-None-Match'] = cache["etag"]
                
            response = requests.get(FEED_URL, headers=headers, timeout=10)
            
            if response.status_code == 200:
                cache["data"] = parse_release_notes(response.content)
                cache["etag"] = response.headers.get('ETag')
                cache["last_fetched"] = response.headers.get('Date')
            elif response.status_code != 304 or cache["data"] is None:
                # If 304 but cache is empty, we must fetch without headers
                response = requests.get(FEED_URL, timeout=10)
                cache["data"] = parse_release_notes(response.content)
                cache["last_fetched"] = response.headers.get('Date')
                
        except Exception as e:
            # If fetch fails, fall back to cached data if available
            if cache["data"] is not None:
                return jsonify({
                    "status": "warning",
                    "message": f"Failed to fetch live updates. Showing cached data. Error: {str(e)}",
                    "updates": cache["data"]
                })
            else:
                return jsonify({
                    "status": "error",
                    "message": f"Failed to retrieve release notes: {str(e)}",
                    "updates": []
                }), 500
                
    return jsonify({
        "status": "success",
        "updates": cache["data"]
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
