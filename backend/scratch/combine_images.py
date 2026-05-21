import os
from PIL import Image

def combine():
    artifacts_dir = r"C:\Users\user\.gemini\antigravity-ide\brain\794c3113-af34-4208-9164-5b2791cf2094"
    
    # Identify the two images
    img1_path = os.path.join(artifacts_dir, "media__1779356914140.png")
    img2_path = os.path.join(artifacts_dir, "media__1779356929754.png")
    
    if not os.path.exists(img1_path) or not os.path.exists(img2_path):
        print("Error: One of the source images is missing.")
        return

    # Load images
    img1 = Image.open(img1_path).convert("RGBA")
    img2 = Image.open(img2_path).convert("RGBA")
    
    # Get dimensions
    w1, h1 = img1.size
    w2, h2 = img2.size
    print(f"Image 1 size: {w1}x{h1}")
    print(f"Image 2 size: {w2}x{h2}")
    
    # Let's scale them to have the same height if they are different (they should be identical, but let's be safe)
    target_height = 800
    
    # Scale image 1
    w1_scaled = int(w1 * (target_height / h1))
    img1_res = img1.resize((w1_scaled, target_height), Image.Resampling.LANCZOS)
    
    # Scale image 2
    w2_scaled = int(w2 * (target_height / h2))
    img2_res = img2.resize((w2_scaled, target_height), Image.Resampling.LANCZOS)
    
    # Create combined image
    # We want a "cross show": Phone 1 on the left (slightly rotated or straight), Phone 2 on the right, overlapping.
    # Total width: width of both scaled minus an overlap of, say, 25% of one phone's width
    overlap = int(w1_scaled * 0.22)
    combined_width = w1_scaled + w2_scaled - overlap
    combined_height = target_height + 60 # extra padding for vertical stagger
    
    # Create transparent canvas
    combined = Image.new("RGBA", (combined_width, combined_height), (0, 0, 0, 0))
    
    # Stagger them vertically: Phone 1 (left) is higher, Phone 2 (right) is lower
    # Or Phone 1 is front/lower, Phone 2 is back/higher.
    # Let's place Phone 2 (right) first (so it's in the background), slightly higher up
    combined.paste(img2_res, (w1_scaled - overlap, 0), img2_res)
    # Then paste Phone 1 (left) on top (so it's in the foreground), slightly lower down
    combined.paste(img1_res, (0, 40), img1_res)
    
    # Save the combined image in the artifacts folder
    output_path = os.path.join(artifacts_dir, "mobile_app_promo_combined.png")
    combined.save(output_path, "PNG")
    print(f"Successfully created combined image at: {output_path}")

if __name__ == "__main__":
    combine()
