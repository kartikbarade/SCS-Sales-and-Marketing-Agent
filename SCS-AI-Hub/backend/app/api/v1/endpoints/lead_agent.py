
import os
import re
import ipaddress
import logging
from urllib.parse import urlparse, urldefrag, urljoin
from urllib.robotparser import RobotFileParser

import requests
import serpapi
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_owner
from app.models.lead import Lead

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/lead-agent",
    tags=["Autonomous Lead Generation Agent"],
)

EMAIL_PATTERN = (
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
)
PHONE_PATTERN = r"(?<!\w)(?:\+91[-\s]?)?[6-9]\d{9}(?!\w)"

REQUEST_TIMEOUT = 12
MAX_SEARCH_MULTIPLIER = 8
MAX_PAGE_BYTES = 5_000_000
USER_AGENT = "SCSAIHubLeadAgent/2.0"

EXCLUDED_DOMAINS = {
    "linkedin.com",
    "scribd.com",
    "slideshare.net",
    "zoominfo.com",
    "justdial.com",
    "sulekha.com",
    "indiamart.com",
    "tradeindia.com",
    "wefru.com",
    "kolkatayellowpagesonline.com",
    "msmemart.com",
    "idbf.in",
    "kompass.com",
    "britannica.com",
    "wikipedia.org",
    "sciencedirect.com",
    "elsevier.com",
}

NON_PROSPECT_DOMAINS = {
    "fssai.gov.in",
    "e-mpeda.nic.in",
    "doca.gov.in",
    "mnre.gov.in",
    "accessdata.fda.gov",
    "dictionary.cambridge.org",
    "merriam-webster.com",
    "vocabulary.com",
    "developer.android.com",
}

INDUSTRY_QUERIES = {
    "manufacturing": [
        "automotive components manufacturer India official company products factory contact",
        "plastic injection moulding manufacturer India official company factory contact",
        "metal fabrication engineering manufacturer India official website contact",
        "industrial packaging manufacturer India official company website contact",
        "machine parts manufacturer India factory official website contact",
        "food processing machinery manufacturer India official company website contact",
    ],
    "food": [
        "food processing company India official products manufacturing plant contact",
        "dairy products manufacturer India official company brands contact",
        "bakery packaged food manufacturer India official factory contact",
        "spices manufacturer India food processing official company contact",
        "packaged food manufacturer India official production facility contact",
    ],
    "healthcare": [
        "private hospital India official website contact",
        "diagnostic laboratory India official website contact",
        "multispeciality clinic India official website contact",
        "medical testing laboratory India official website contact",
    ],
    "ca": [
        "chartered accountant firm India official website contact",
        "CA firm accounting tax advisory India official contact",
    ],
    "education": [
        "school India official website contact admissions",
        "coaching institute India official website contact courses",
        "educational institution India official website contact",
    ],
    "all": [
        "manufacturing company India factory official website contact",
        "food processing company India official website contact",
        "private hospital diagnostic laboratory India official website contact",
        "chartered accountant firm India official website contact",
        "school coaching institute India official website contact",
    ],
}

PROVIDER_KEYWORDS = (
    "certification body",
    "certification bodies",
    "certification services",
    "certification agency",
    "certification agencies",
    "certification company",
    "certification companies",
    "iso consultant",
    "iso consultancy",
    "iso consultants",
    "iso consulting",
    "certification consultant",
    "certification consultancy",
    "certification auditor",
    "certification auditors",
    "lead auditor",
    "quality auditor",
    "third party auditor",
    "management system certification",
    "certification assessment",
    "certification provider",
    "certification providers",
    "get certified with us",
    "we certify",
    "we provide certification",
    "iso registrar",
    "accreditation body",
    "iso certification services",
    "iso certification consultancy",
)

EXCLUDED_KEYWORDS = (
    "software development company",
    "software development services",
    "software solutions provider",
    "information technology services",
    "it consulting services",
    "artificial intelligence solutions",
    "machine learning services",
    "web development agency",
    "app development company",
    "saas platform",
    "cloud computing services",
)

DIRECTORY_PHRASES = (
    "top companies",
    "list of companies",
    "email id format",
    "contact database",
    "directory of",
    "manufacturers directory",
    "manufacturer directory",
    "manufacturers list",
    "supplier directory",
    "business directory",
    "company directory",
    "industrial directory",
    "list of manufacturers",
    "manufacturer database",
    "supplier list",
    "company listings",
    "business listings",
    "top manufacturers in india",
    "best manufacturers in india",
    "how to start",
    "how to set up",
    "step by step guide",
    "complete guide",
    "industry overview",
    "investment opportunities",
    "market analysis",
    "market trends",
    "latest news",
    "research report",
    "government schemes",
    "issued certificates",
    "certificate register",
    "region wise exporters",
    "exporter registration report",
    "knowledge centre",
    "what is iso",
    "benefits of iso",
    "iso certification cost",
    "how to get iso certified",
    "iso certification process",
)

GENERIC_TITLES = {
    "about us",
    "about",
    "contact us",
    "contact",
    "home",
    "homepage",
    "products",
    "our products",
    "services",
    "our services",
    "company profile",
    "privacy policy",
    "terms and conditions",
    "sitemap",
    "search results",
    "login",
    "sign in",
    "register",
    "issued certificates",
    "process",
}

INFORMATIONAL_TITLE_PHRASES = (
    "news and articles",
    "manufacturing news",
    "articles and insights",
    "api reference",
    "definition of",
    "meaning -",
    "sector profile",
    "government report",
    "certificate register",
    "exporters detailed",
)

INDUSTRY_ALIASES = {
    "manufacturing": "manufacturing",
    "manufacturer": "manufacturing",
    "food": "food",
    "food processing": "food",
    "food processing & food businesses": "food",
    "healthcare": "healthcare",
    "health care": "healthcare",
    "doctor": "healthcare",
    "doctors": "healthcare",
    "clinic": "healthcare",
    "clinics": "healthcare",
    "hospital": "healthcare",
    "hospitals": "healthcare",
    "ca": "ca",
    "accounting": "ca",
    "chartered accountant": "ca",
    "chartered accountants": "ca",
    "education": "education",
    "school": "education",
    "schools": "education",
    "teacher": "education",
    "teachers": "education",
    "coaching": "education",
    "services": "all",
    "all": "all",
}


class LeadAgentRequest(BaseModel):
    industry: str = Field(default="all", min_length=1, max_length=100)
    target_count: int = Field(default=10, ge=1, le=100)


class LeadAgentResponse(BaseModel):
    message: str
    industry: str
    target_count: int
    found: int
    saved: int
    skipped: int
    status: str
    skip_reasons: dict[str, int] = Field(default_factory=dict)


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip().lower()


def get_hostname(url: str) -> str:
    try:
        return (urlparse(url).hostname or "").lower().rstrip(".")
    except ValueError:
        return ""


def canonicalize_url(url: str) -> str:
    try:
        clean_url, _ = urldefrag((url or "").strip())
        parsed = urlparse(clean_url)

        if parsed.scheme.lower() not in ("http", "https"):
            return ""

        if not parsed.hostname:
            return ""

        host = parsed.hostname.lower().rstrip(".")
        if host.startswith("www."):
            host = host[4:]

        path = parsed.path.rstrip("/") or "/"
        return f"https://{host}{path}"

    except ValueError:
        return ""


def is_excluded_domain(url: str) -> bool:
    hostname = get_hostname(url)
    if not hostname:
        return True

    domains = EXCLUDED_DOMAINS | NON_PROSPECT_DOMAINS
    return any(
        hostname == domain or hostname.endswith("." + domain)
        for domain in domains
    )


def is_public_web_url(url: str) -> bool:
    """Reject non-web URLs and private/local IP destinations."""
    try:
        parsed = urlparse(url)
        host = parsed.hostname

        if parsed.scheme not in ("http", "https") or not host:
            return False

        if host.lower() in ("localhost",):
            return False

        try:
            address = ipaddress.ip_address(host)
            if not address.is_global:
                return False
        except ValueError:
            # A DNS hostname is allowed. Requests still uses a timeout.
            pass

        return True
    except ValueError:
        return False


def is_generic_title(title: str) -> bool:
    normalized = normalize_text(title)

    if normalized in GENERIC_TITLES:
        return True

    patterns = (
        r"^about us\b",
        r"^contact us\b",
        r"^home(?:page)?$",
        r"^products?$",
        r"^services$",
        r"^our products$",
        r"^our services$",
        r"^company profile$",
        r"^list of\b",
        r"^top \d+\b",
    )
    return any(re.search(p, normalized) for p in patterns)


def is_excluded_result(title: str, snippet: str, url: str = "") -> bool:
    title_text = normalize_text(title)
    snippet_text = normalize_text(snippet)
    text = f"{title_text} {snippet_text}"
    hostname = get_hostname(url)

    if not title_text or is_generic_title(title):
        return True

    if any(word in text for word in EXCLUDED_KEYWORDS):
        return True

    strong_provider_phrases = (
        "iso certification services",
        "certification services",
        "certification body",
        "certification agency",
        "iso consultant",
        "iso consultancy",
        "certification consultant",
        "certification provider",
        "iso registrar",
        "bureau of indian standards",
        "bis certification",
        "we certify",
        "we provide certification",
    )
    if any(phrase in title_text for phrase in strong_provider_phrases):
        return True

    if any(word in text for word in PROVIDER_KEYWORDS):
        return True

    if any(phrase in text for phrase in DIRECTORY_PHRASES):
        return True

    if any(phrase in title_text for phrase in INFORMATIONAL_TITLE_PHRASES):
        return True

    provider_domain_terms = (
        "iso-consult",
        "isoaudit",
        "iso-audit",
        "registrar",
        "certification-body",
    )
    if any(term in hostname for term in provider_domain_terms):
        return True

    return False


def get_session():
    return requests.Session()


def is_relevant_to_industry(
    category: str,
    title: str,
    snippet: str,
    website_data: dict,
) -> bool:
    """Require positive industry evidence while allowing blocked websites."""
    title_text = normalize_text(title)
    snippet_text = normalize_text(snippet)
    site_title = normalize_text(website_data.get("title", ""))
    site_description = normalize_text(website_data.get("description", ""))

    # Search-result title/snippet are kept separate from website metadata so
    # unrelated text elsewhere on a site cannot make an irrelevant result pass.
    primary_text = f"{title_text} {snippet_text}"
    site_text = f"{site_title} {site_description}"
    all_text = f"{primary_text} {site_text}"

    informational_titles = (
        "wikipedia", "britannica", "science direct", "sciencedirect",
        "plant science", "research journal", "scientific journal",
        "research article", "encyclopedia", "encyclopaedia",
        "definition of", "meaning of ", "taxonomy of", "ecology of",
        "industry overview", "market analysis", "list of companies",
        "directory of", "top manufacturers", "latest news",
    )
    if any(phrase in f"{title_text} {site_title}" for phrase in informational_titles):
        return False

    industry_keywords = {
        "food": (
            "food processing", "food products", "food manufacturer",
            "food manufacturing", "food company", "food production",
            "dairy", "bakery", "spices", "packaged food", "beverages",
            "snacks", "confectionery", "edible oil", "milk products",
            "frozen foods", "agro foods", "agro-food", "rice mill",
            "flour mill", "grain processing", "meat processing", "seafood",
            "poultry products", "food factory", "food industry",
        ),
        "manufacturing": (
            "manufacturer", "manufacturing", "factory", "fabrication",
            "automotive components", "auto parts", "plastic moulding",
            "plastic molding", "industrial packaging", "machine parts",
            "metal products", "precision components", "industrial equipment",
            "engineering products", "production facility", "manufacturing plant",
        ),
        "healthcare": (
            "hospital", "clinic", "medical centre", "medical center",
            "diagnostic laboratory", "diagnostic centre", "diagnostic center",
            "healthcare", "health care", "pathology laboratory", "doctor",
            "physician", "multispeciality", "multispecialty", "medical services",
        ),
        "ca": (
            "chartered accountant", "chartered accountants", "ca firm",
            "accounting firm", "tax advisory", "accounting services",
            "chartered accountancy", "ca practice",
        ),
        "education": (
            "school", "coaching institute", "coaching classes",
            "educational institution", "education institute", "college",
            "academy", "training institute", "primary school", "secondary school",
        ),
    }

    if category == "all":
        return any(
            keyword in all_text
            for keywords in industry_keywords.values()
            for keyword in keywords
        )

    keywords = industry_keywords.get(category, ())
    if not keywords:
        return False

    # Require industry evidence in the search result OR in fetched site metadata.
    # This avoids passing a generic title just because a long page mentions a word.
    return any(keyword in primary_text for keyword in keywords) or any(
        keyword in site_text for keyword in keywords
    )


def fetch_official_page(url: str) -> dict:
    """
    Fetch a candidate business page and extract basic identity/contact data.
    Search results are still unverified prospects, not confirmed buyers.
    """
    empty = {
        "final_url": url,
        "title": "",
        "company": "",
        "description": "",
        "emails": [],
        "phones": [],
        "contact_person": "",
        "same_domain": False,
    }

    logger.info("Website extraction started: url=%s", url)

    if not is_public_web_url(url):
        logger.info("Website extraction skipped: URL is not public: %s", url)
        return empty

    try:
        with get_session() as session:
            response = session.get(
                url,
                timeout=REQUEST_TIMEOUT,
                headers={"User-Agent": USER_AGENT},
                allow_redirects=True,
                stream=True,
            )
            response.raise_for_status()

            final_url = response.url
            if not is_public_web_url(final_url):
                return empty

            # Only read a bounded amount of the response.
            content = bytearray()
            for chunk in response.iter_content(chunk_size=65536):
                if not chunk:
                    continue
                content.extend(chunk)
                if len(content) > MAX_PAGE_BYTES:
                    return empty

            content_type = response.headers.get("content-type", "").lower()
            if content_type and not any(
                item in content_type
                for item in ("text/html", "application/xhtml+xml", "text/plain")
            ):
                return empty

            html = bytes(content).decode(
                response.encoding or "utf-8", errors="replace"
            )

        soup = BeautifulSoup(html, "html.parser")

        for element in soup(
            ["script", "style", "noscript", "svg", "iframe"]
        ):
            element.decompose()

        title = soup.title.get_text(" ", strip=True) if soup.title else ""
        description_tag = soup.find(
            "meta", attrs={"name": re.compile("^description$", re.I)}
        )
        description = (
            description_tag.get("content", "").strip()
            if description_tag else ""
        )

        # Prefer explicit organization metadata over a generic page title.
        company = ""
        for selector in (
            ("meta", {"property": "og:site_name"}),
            ("meta", {"name": "application-name"}),
        ):
            tag = soup.find(*selector)
            if tag and tag.get("content"):
                company = tag["content"].strip()
                if company:
                    break

        if not company:
            company = title

        page_text = soup.get_text(" ", strip=True)
        emails = {
            match.lower()
            for match in re.findall(EMAIL_PATTERN, page_text)
        }
        phones = set(re.findall(PHONE_PATTERN, page_text))

        
        # Also inspect same-site Contact/About links for public contact details.
        contact_keywords = (
            "contact", "about", "reach-us", "get-in-touch",
            "contact-us", "our-team"
        )

        contact_urls = []
        for link in soup.find_all("a", href=True):
            href = link["href"].strip()
            link_text = link.get_text(" ", strip=True).lower()
            combined = f"{href} {link_text}".lower()

            if not any(keyword in combined for keyword in contact_keywords):
                continue

            absolute_url = urljoin(final_url, href)

            if not is_public_web_url(absolute_url):
                continue

            original_host = get_hostname(final_url)
            contact_host = get_hostname(absolute_url)

            if (
                original_host and contact_host
                and (
                    contact_host == original_host
                    or contact_host.endswith("." + original_host)
                    or original_host.endswith("." + contact_host)
                )
                and absolute_url not in contact_urls
            ):
                contact_urls.append(absolute_url)

        for contact_url in contact_urls[:3]:
            try:
                with get_session() as contact_session:
                    contact_response = contact_session.get(
                        contact_url,
                        timeout=REQUEST_TIMEOUT,
                        headers={"User-Agent": USER_AGENT},
                        allow_redirects=True,
                        stream=True,
                    )
                    contact_response.raise_for_status()

                    contact_final_url = contact_response.url
                    if not is_public_web_url(contact_final_url):
                        continue

                    content_type = contact_response.headers.get(
                        "content-type", ""
                    ).lower()

                    if content_type and not any(
                        item in content_type
                        for item in (
                            "text/html",
                            "application/xhtml+xml",
                            "text/plain",
                        )
                    ):
                        continue

                    contact_content = bytearray()
                    for chunk in contact_response.iter_content(
                        chunk_size=16384
                    ):
                        if chunk:
                            contact_content.extend(chunk)
                        if len(contact_content) > MAX_PAGE_BYTES:
                            break

                    if len(contact_content) > MAX_PAGE_BYTES:
                        continue

                    contact_html = bytes(contact_content).decode(
                        contact_response.encoding or "utf-8",
                        errors="replace",
                    )

                contact_soup = BeautifulSoup(
                    contact_html, "html.parser"
                )

                contact_text = contact_soup.get_text(" ", strip=True)

                emails.update(
                    match.lower()
                    for match in re.findall(
                        EMAIL_PATTERN, contact_text
                    )
                )
                phones.update(
                    re.findall(PHONE_PATTERN, contact_text)
                )

                for contact_link in contact_soup.find_all(
                    "a", href=True
                ):
                    contact_href = contact_link["href"].strip()

                    if contact_href.lower().startswith("mailto:"):
                        email = (
                            contact_href[7:].split("?")[0]
                            .strip().lower()
                        )
                        if re.fullmatch(EMAIL_PATTERN, email):
                            emails.add(email)

                    elif contact_href.lower().startswith("tel:"):
                        phone = (
                            contact_href[4:].split("?")[0].strip()
                        )
                        digits = re.sub(r"\D", "", phone)
                        if 10 <= len(digits) <= 13:
                            phones.add(phone)

            except (
                requests.RequestException, ValueError, UnicodeError
            ) as error:
                logger.debug(
                    "Contact page extraction failed for %s: %s",
                    contact_url, error
                )


        for link in soup.find_all("a", href=True):
            href = link["href"].strip()

            if href.lower().startswith("mailto:"):
                email = href[7:].split("?")[0].strip().lower()
                if re.fullmatch(EMAIL_PATTERN, email):
                    emails.add(email)

            elif href.lower().startswith("tel:"):
                phone = href[4:].split("?")[0].strip()
                digits = re.sub(r"\D", "", phone)
                if 10 <= len(digits) <= 13:
                    phones.add(phone)

        # A contact person is only accepted from explicit page labels.
        contact_person = ""
        person_patterns = (
            r"(?:contact person|contact name|sales contact|"
            r"business development contact)\s*[:\-]\s*"
            r"([A-Z][A-Za-z.' -]{2,60})",
        )
        for pattern in person_patterns:
            match = re.search(pattern, page_text, re.I)
            if match:
                candidate = match.group(1).strip(" .,-")
                if candidate and len(candidate.split()) <= 6:
                    contact_person = candidate
                    break

        original_host = get_hostname(url)
        final_host = get_hostname(final_url)
        same_domain = bool(
            original_host and final_host
            and (
                original_host == final_host
                or original_host.endswith("." + final_host)
                or final_host.endswith("." + original_host)
            )
        )

        logger.info(
            "Contact extraction: domain=%s emails=%d phones=%d contact_pages=%d",
            get_hostname(final_url),
            len(emails),
            len(phones),
            len(contact_urls),
        )

        return {
            "final_url": final_url,
            "title": title,
            "company": company,
            "description": description,
            "emails": sorted(emails),
            "phones": sorted(phones),
            "contact_person": contact_person,
            "same_domain": same_domain,
        }

    except (requests.RequestException, ValueError, UnicodeError) as error:
        logger.info("Website extraction failed for %s: %s", url, error)
        return empty


def clean_company_name(value: str) -> str:
    """Remove common page-title suffixes without inventing a name."""
    value = re.sub(r"\s+", " ", value or "").strip()
    value = re.sub(
        r"\s*[|–—]\s*(official website|home|about us|contact us)\s*$",
        "",
        value,
        flags=re.I,
    )
    value = re.sub(r"\s*-\s*official website\s*$", "", value, flags=re.I)
    return value.strip(" -|–—")


def choose_company_name(search_title: str, website_data: dict) -> str:
    """
    Prefer organization/site metadata, then page title, then search title.
    This is a best-effort name, not independently verified legal identity.
    """
    candidates = [
        website_data.get("company", ""),
        website_data.get("title", ""),
        search_title,
    ]

    for candidate in candidates:
        cleaned = clean_company_name(candidate)
        if cleaned and not is_generic_title(cleaned):
            return cleaned[:150]

    return clean_company_name(search_title)[:150]


def is_likely_contact_email(email: str, company_url: str) -> bool:
    """Prefer business contacts; avoid obvious technical/no-reply addresses."""
    local_part = email.split("@", 1)[0].lower()
    if any(
        token in local_part
        for token in ("noreply", "no-reply", "donotreply", "example", "test")
    ):
        return False
    return True


def choose_email(candidates: list[str], company_url: str) -> str | None:
    hostname = get_hostname(company_url)
    valid = sorted({
        email.lower()
        for email in candidates
        if re.fullmatch(EMAIL_PATTERN, email or "")
        and is_likely_contact_email(email, company_url)
    })

    # Prefer email addresses on the business's own domain.
    if hostname:
        same_domain = [
            email for email in valid
            if email.rsplit("@", 1)[1].lower() == hostname
            or email.rsplit("@", 1)[1].lower().endswith("." + hostname)
        ]
        if same_domain:
            return same_domain[0]

    return valid[0] if valid else None


def choose_phone(candidates: list[str]) -> str | None:
    valid = set()

    for candidate in candidates:
        digits = re.sub(r"\D", "", candidate or "")
        if len(digits) == 10 and digits[0] in "6789":
            valid.add(digits)
        elif len(digits) == 12 and digits.startswith("91"):
            valid.add("+" + digits)
        elif len(digits) == 11 and digits.startswith("0"):
            valid.add(digits)

    return sorted(valid)[0] if valid else None


def get_search_results(client, queries: list[str], target_count: int) -> list:
    """Collect unique organic results."""
    organic_results = []
    seen_urls = set()
    max_results = target_count * MAX_SEARCH_MULTIPLIER

    for query in queries:
        try:
            results = client.search(
                engine="google",
                q=query,
                num=min(target_count * 2, 100),
                gl="in",
                hl="en",
            )
        except Exception as error:
            logger.warning("Search query failed: %s", error)
            continue

        for item in results.get("organic_results", []):
            url = (item.get("link") or "").strip()
            canonical_url = canonicalize_url(url)

            if not canonical_url or canonical_url in seen_urls:
                continue

            seen_urls.add(canonical_url)
            organic_results.append(item)

            if len(organic_results) >= max_results:
                return organic_results

    return organic_results


def find_duplicate_lead(
    db: Session,
    company: str,
    contact_name: str,
    email: str | None,
    website: str,
):
    """Check duplicates using fields available in the existing Lead model."""
    candidates = [company, contact_name]

    for candidate in candidates:
        if candidate:
            found = db.query(Lead).filter(
                Lead.name == candidate[:100]
            ).first()
            if found:
                return found

            found = db.query(Lead).filter(
                Lead.company == candidate[:150]
            ).first()
            if found:
                return found

    if email:
        found = db.query(Lead).filter(Lead.email == email).first()
        if found:
            return found

    # The existing model may not have a dedicated website column.
    # Search the saved notes instead of changing the database schema.
    if website:
        found = db.query(Lead).filter(
            Lead.notes.contains(website)
        ).first()
        if found:
            return found

    return None


@router.post("/run", response_model=LeadAgentResponse)
def run_lead_agent(
    request: LeadAgentRequest,
    db: Session = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    """Find potential business prospects and save qualified candidates."""
    api_key = os.getenv("SERPAPI_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="SERPAPI_KEY is missing from backend/.env.",
        )

    industry = normalize_text(request.industry)
    category = INDUSTRY_ALIASES.get(industry)

    if category is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported industry. Choose manufacturing, food, "
                "healthcare, CA, education, or all."
            ),
        )

    try:
        client = serpapi.Client(api_key=api_key, timeout=60)
        organic_results = get_search_results(
            client,
            INDUSTRY_QUERIES[category],
            request.target_count,
        )
    except Exception as error:
        logger.exception("Lead search initialization failed")
        raise HTTPException(
            status_code=502,
            detail="Web search failed. Check SerpAPI access and try again.",
        ) from error

    saved = 0
    skipped = 0
    saved_urls = set()
    skip_reasons = {}

    def skip(reason: str):
        nonlocal skipped
        skipped += 1
        skip_reasons[reason] = skip_reasons.get(reason, 0) + 1

    for item in organic_results:
        if saved >= request.target_count:
            skip("target_count_reached")
            continue

        title = (item.get("title") or "").strip()
        website = (item.get("link") or "").strip()
        snippet = (item.get("snippet") or "").strip()

        if not title or not website:
            skip("missing_title_or_url")
            continue

        canonical_url = canonicalize_url(website)
        if not canonical_url:
            skip("invalid_url")
            continue

        if not is_public_web_url(website):
            skip("non_public_or_invalid_url")
            continue

        if is_excluded_domain(website):
            skip("excluded_domain")
            continue

        if is_excluded_result(title, snippet, website):
            skip("excluded_result")
            continue

        if canonical_url in saved_urls:
            skip("duplicate_url_in_run")
            continue

        website_data = fetch_official_page(website)
        # Some genuine business websites block automated requests or time out.
        # Do not discard them automatically: use the search title/snippet as
        # provisional evidence, then apply the same exclusion and industry checks.
        # The saved lead notes explicitly mark website verification status.
        company = choose_company_name(title, website_data)
        if not company or is_generic_title(company):
            skip("no_reliable_company_name")
            continue

        if is_excluded_result(
            company,
            website_data.get("description", ""),
            website,
        ):
            skip("website_content_excluded")
            continue

        
        if not is_relevant_to_industry(
            category=category,
            title=title,
            snippet=snippet,
            website_data=website_data,
        ):
            skip("industry_not_relevant")
            continue


        contact_person = website_data.get("contact_person", "").strip()
        lead_name = contact_person or company

        all_emails = list(website_data.get("emails", []))
        all_emails.extend(
            re.findall(EMAIL_PATTERN, f"{title} {snippet}")
        )
        email = choose_email(all_emails, website)

        all_phones = list(website_data.get("phones", []))
        all_phones.extend(
            re.findall(PHONE_PATTERN, f"{title} {snippet}")
        )
        phone = choose_phone(all_phones)

        if find_duplicate_lead(
            db=db,
            company=company,
            contact_name=contact_person,
            email=email,
            website=website,
        ):
            skip("duplicate_lead")
            continue

        final_url = website_data.get("final_url") or website
        final_host = get_hostname(final_url)
        original_host = get_hostname(website)
        website_status = (
            "Website fetched; same-domain redirect."
            if website_data.get("same_domain")
            else (
                "Website content fetched; redirect host differs or could not be confirmed."
                if website_data.get("title")
                else "Website could not be verified automatically; search result used as provisional evidence."
            )
        )

        contact_status = (
            "Public contact details found; accuracy not independently verified."
            if email or phone
            else "No public email/phone found in inspected page or search snippet."
        )

        person_status = (
            "Contact person name found on page; verify before outreach."
            if contact_person
            else "No explicit contact person found; lead name uses company name."
        )

        lead = Lead(
            name=lead_name[:100],
            email=email[:150] if email else None,
            phone=phone[:20] if phone else None,
            company=company[:150],
            status="New",
            source="SerpAPI Google Search",
            notes=(
                f"Search result title: {title}\n"
                f"Website: {website}\n"
                f"Final website host: {final_host or original_host}\n"
                f"Website check: {website_status}\n"
                f"Search description: {snippet}\n"
                f"Website description: "
                f"{website_data.get('description', '')}\n"
                f"Target category: {category}\n"
                f"Contact person check: {person_status}\n"
                f"Contact details: {contact_status}\n"
                "Lead type: Potential business customer; not a confirmed buyer.\n"
                "ISO need: Not confirmed by search.\n"
                "Next step: Verify legal business identity, official website, "
                "contact details, business activity, and actual ISO requirements "
                "before outreach."
            ),
        )

        db.add(lead)
        saved_urls.add(canonical_url)
        saved += 1

    try:
        db.commit()
    except Exception as error:
        db.rollback()
        logger.exception("Could not save generated leads")
        raise HTTPException(
            status_code=500,
            detail="Could not save generated leads to the database.",
        ) from error

    logger.info(
        "Lead agent result: category=%s found=%d saved=%d skipped=%d reasons=%s",
        category,
        len(organic_results),
        saved,
        skipped,
        skip_reasons,
    )

    return LeadAgentResponse(
        message=(
            "Prospect search completed. Search results are potential prospects "
            "only. Company names and public contact details are best-effort "
            "extractions and require manual verification. ISO need is not "
            "confirmed. Existing leads are not deleted."
        ),
        industry=category,
        target_count=request.target_count,
        found=len(organic_results),
        saved=saved,
        skipped=skipped,
        status="completed",
        skip_reasons=skip_reasons,
    )
