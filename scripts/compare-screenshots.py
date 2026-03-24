#!/usr/bin/env python3
"""
Generate a side-by-side PDF comparing web and mobile screenshots.

Usage:
    python3 scripts/compare-screenshots.py

Expects:
    screenshots/web/    — Playwright screenshots (390x844 viewport)
    screenshots/        — Maestro screenshots (device resolution)

Outputs:
    screenshots/comparison.pdf
"""

import os
import glob
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SCREENSHOTS_DIR = Path("screenshots")
WEB_DIR = SCREENSHOTS_DIR / "web"
MOBILE_DIR = SCREENSHOTS_DIR
OUTPUT_PDF = SCREENSHOTS_DIR / "comparison.pdf"

# Target height for each row (scale both images to this)
ROW_HEIGHT = 900
PADDING = 40
LABEL_HEIGHT = 50
BG_COLOR = (245, 240, 232)  # bark-100
TEXT_COLOR = (58, 48, 40)    # bark-700
HEADER_COLOR = (74, 124, 89) # eucalyptus-400

# Map screenshot names to friendly labels
SCREEN_LABELS = {
    "01-login-filled": "Login",
    "02-dashboard": "Dashboard",
    "02b-dashboard-approvals": "Dashboard (approvals)",
    "03-dashboard-full": "Dashboard (full)",
    "04-kids": "Kids",
    "05-chores": "Chores",
    "06-goals": "Goals",
    "07-pocket-money": "Pocket Money",
    "08-profile-panel": "Profile Panel",
    "09-create-chore-empty": "Create Chore (empty)",
    "10-create-chore-filled": "Create Chore (filled)",
}


def find_matching_screenshots():
    """Find web/mobile screenshot pairs by matching filenames."""
    web_files = {Path(f).stem: f for f in glob.glob(str(WEB_DIR / "*.png"))}
    mobile_files = {Path(f).stem: f for f in glob.glob(str(MOBILE_DIR / "*.png"))
                    if Path(f).parent == MOBILE_DIR}

    pairs = []
    for name in sorted(web_files.keys()):
        if name in mobile_files:
            pairs.append((name, web_files[name], mobile_files[name]))
        else:
            pairs.append((name, web_files[name], None))

    # Add mobile-only screenshots
    for name in sorted(mobile_files.keys()):
        if name not in web_files:
            pairs.append((name, None, mobile_files[name]))

    return pairs


def scale_to_height(img, target_height):
    """Scale image to target height, preserving aspect ratio."""
    ratio = target_height / img.height
    new_width = int(img.width * ratio)
    return img.resize((new_width, target_height), Image.LANCZOS)


def create_comparison_page(name, web_path, mobile_path):
    """Create a single comparison image with web on left, mobile on right."""
    label = SCREEN_LABELS.get(name, name)

    web_img = Image.open(web_path) if web_path else None
    mobile_img = Image.open(mobile_path) if mobile_path else None

    # Scale both to same height
    if web_img:
        web_img = scale_to_height(web_img, ROW_HEIGHT)
    if mobile_img:
        mobile_img = scale_to_height(mobile_img, ROW_HEIGHT)

    # Calculate page dimensions
    web_width = web_img.width if web_img else 0
    mobile_width = mobile_img.width if mobile_img else 0

    if web_img and mobile_img:
        page_width = web_width + mobile_width + PADDING * 3
    else:
        page_width = max(web_width, mobile_width) + PADDING * 2

    page_height = ROW_HEIGHT + LABEL_HEIGHT * 2 + PADDING * 2

    # Create page
    page = Image.new("RGB", (page_width, page_height), BG_COLOR)
    draw = ImageDraw.Draw(page)

    # Try to load a font, fall back to default
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
        label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except OSError:
        title_font = ImageFont.load_default()
        label_font = ImageFont.load_default()

    # Title
    draw.text((PADDING, PADDING // 2), label, fill=HEADER_COLOR, font=title_font)

    y_offset = LABEL_HEIGHT + PADDING // 2

    if web_img and mobile_img:
        # Column labels
        draw.text((PADDING + web_width // 2 - 20, y_offset - 25), "Web", fill=TEXT_COLOR, font=label_font)
        draw.text((PADDING * 2 + web_width + mobile_width // 2 - 25, y_offset - 25), "Mobile", fill=TEXT_COLOR, font=label_font)

        # Images
        page.paste(web_img, (PADDING, y_offset))
        page.paste(mobile_img, (PADDING * 2 + web_width, y_offset))
    elif web_img:
        draw.text((PADDING, y_offset - 25), "Web only", fill=TEXT_COLOR, font=label_font)
        page.paste(web_img, (PADDING, y_offset))
    elif mobile_img:
        draw.text((PADDING, y_offset - 25), "Mobile only", fill=TEXT_COLOR, font=label_font)
        page.paste(mobile_img, (PADDING, y_offset))

    return page


def main():
    pairs = find_matching_screenshots()

    if not pairs:
        print("No screenshots found. Run:")
        print("  npm run screenshots:web     (Playwright)")
        print("  npm run screenshots:mobile  (Maestro)")
        return

    print(f"Found {len(pairs)} screenshot pairs:")
    for name, web, mobile in pairs:
        status = "✓ both" if web and mobile else ("web only" if web else "mobile only")
        print(f"  {name}: {status}")

    pages = []
    for name, web_path, mobile_path in pairs:
        if web_path or mobile_path:
            page = create_comparison_page(name, web_path, mobile_path)
            pages.append(page)

    if not pages:
        print("No comparison pages generated.")
        return

    # Save as PDF
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    pages[0].save(
        str(OUTPUT_PDF),
        "PDF",
        save_all=True,
        append_images=pages[1:],
        resolution=150,
    )
    print(f"\n✓ Comparison PDF saved to: {OUTPUT_PDF}")
    print(f"  {len(pages)} pages")


if __name__ == "__main__":
    main()
