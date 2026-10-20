
import os
import re
from pathlib import Path
from urllib.parse import urlparse

import requests
import serpapi
from bs4 import BeautifulSoup
from dotenv import load_dotenv


# Load environment variables from backend/.env
load_dotenv(Path(__file__).resolve().parent / ".env")

api_key = os.getenv("SERPAPI_KEY")

if not api_key:
    raise RuntimeError(
        "SERPAPI_KEY missing. Check your backend/.env file."
    )


# Patterns for publicly visible contact information
EMAIL_PATTERN = (
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
)

PHONE_PATTERN = (
    r"(?<!\w)(?:\+91[-\s]?)?[6-9]\d{9}(?!\w)"
)

EXCLUDED_DOMAINS = (
    "scribd.com",
    "slideshare.net",
    "linkedin.com",
    "zoominfo.com",
)

COMPANY_KEYWORDS = (
    "software company",
    "software development",
    "technology",
    "it solutions",
    "digital transformation",
)


def extract_contact_details(url: str) -> dict:
    """Extract publicly visible email addresses and phone numbers."""

    # Only allow normal HTTP/HTTPS website URLs
    parsed_url = urlparse(url)

    if parsed_url.scheme not in ("http", "https") or not parsed_url.hostname:
        return {"emails": [], "phones": []}

    try:
        response = requests.get(
            url,
            timeout=15,
            headers={
                "User-Agent": "SCSAIHubLeadAgent/1.0"
            },
        )
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Remove non-visible page sections
        for element in soup(
            ["script", "style", "noscript", "svg"]
        ):
            element.decompose()

        page_text = soup.get_text(" ", strip=True)

        # Also inspect mailto: and tel: links
        email_values = set(
            re.findall(EMAIL_PATTERN, page_text)
        )

        phone_values = set(
            re.findall(PHONE_PATTERN, page_text)
        )

        for link in soup.find_all("a", href=True):
            href = link["href"].strip()

            if href.lower().startswith("mailto:"):
                email = href[7:].split("?")[0].strip()
                if re.fullmatch(EMAIL_PATTERN, email):
                    email_values.add(email)

            elif href.lower().startswith("tel:"):
                phone = href[4:].split("?")[0].strip()
                digits = re.sub(r"\D", "", phone)

                if 10 <= len(digits) <= 13:
                    phone_values.add(phone)

        return {
            "emails": sorted(email_values),
            "phones": sorted(phone_values),
        }

    except requests.RequestException as error:
        print(
            f"Website could not be checked: "
            f"{parsed_url.hostname} ({type(error).__name__})"
        )
        return {"emails": [], "phones": []}


def main():
    client = serpapi.Client(
        api_key=api_key,
        timeout=60,
    )

    results = client.search(
        engine="google",
        q='"software company" Pune India contact email',
        num=10,
    )

    organic_results = results.get("organic_results", [])

    print(
        f"Search successful. Results found: "
        f"{len(organic_results)}"
    )

    for item in organic_results:
        title = item.get("title", "")
        website = item.get("link", "")
        snippet = item.get("snippet", "")

        if not website:
            continue

        parsed_url = urlparse(website)
        hostname = (parsed_url.hostname or "").lower()

        # Skip selected directory and profile websites
        if any(
            hostname == domain or hostname.endswith("." + domain)
            for domain in EXCLUDED_DOMAINS
        ):
            continue

        text_to_check = f"{title} {snippet}".lower()

        if not any(
            keyword in text_to_check
            for keyword in COMPANY_KEYWORDS
        ):
            continue

        # Contact details visible in the search result
        search_text = f"{title} {snippet}"

        search_emails = set(
            re.findall(EMAIL_PATTERN, search_text)
        )

        search_phones = set(
            re.findall(PHONE_PATTERN, search_text)
        )

        # Contact details available on the website
        contact = extract_contact_details(website)

        all_emails = sorted(
            search_emails | set(contact["emails"])
        )
        all_phones = sorted(
            search_phones | set(contact["phones"])
        )

        print("\nPotential Company:", title)
        print("Website:", website)
        print(
            "Email:",
            ", ".join(all_emails) or "Not found",
        )
        print(
            "Phone:",
            ", ".join(all_phones) or "Not found",
        )
        print("Search description:", snippet)
        print("-" * 60)


if __name__ == "__main__":
    main()
