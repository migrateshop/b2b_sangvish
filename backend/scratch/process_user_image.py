import os
from PIL import Image

def remove_white_background(img, threshold=240):
    img = img.convert("RGBA")
    w, h = img.size
    pixels = img.load()
    visited = set()
    queue = []
    
    # Check edges to seed queue
    for x in range(w):
        for y in [0, h - 1]:
            r, g, b, a = pixels[x, y][:4]
            if r >= threshold and g >= threshold and b >= threshold:
                queue.append((x, y))
                visited.add((x, y))
                
    for y in range(h):
        for x in [0, w - 1]:
            if (x, y) not in visited:
                r, g, b, a = pixels[x, y][:4]
                if r >= threshold and g >= threshold and b >= threshold:
                    queue.append((x, y))
                    visited.add((x, y))
                    
    # BFS
    while queue:
        cx, cy = queue.pop(0)
        pixels[cx, cy] = (0, 0, 0, 0) # transparent
        
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                r, g, b, a = pixels[nx, ny][:4]
                if r >= threshold and g >= threshold and b >= threshold:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
                    
    return img

def main():
    src_path = r"C:\Users\user\.gemini\antigravity-ide\brain\tempmediaStorage\media__1779358998184.png"
    brain_dest = r"C:\Users\user\.gemini\antigravity-ide\brain\794c3113-af34-4208-9164-5b2791cf2094\mobile_app_promo_combined.png"
    uploads_dest = r"E:\alibaba_live\backend\uploads\homepage\mobile_app_promo_combined.png"
    
    if not os.path.exists(src_path):
        print(f"Error: Source image not found at {src_path}")
        return
        
    print(f"Loading image from {src_path}...")
    img = Image.open(src_path)
    print(f"Original size: {img.size}")
    
    print("Removing white background...")
    img_transparent = remove_white_background(img, threshold=240)
    
    print("Auto-cropping transparent boundaries...")
    bbox = img_transparent.getbbox()
    if bbox:
        img_cropped = img_transparent.crop(bbox)
        print(f"Cropped size: {img_cropped.size}")
    else:
        img_cropped = img_transparent
        print("No bounding box found, keeping size.")
        
    # Save to brain artifact folder
    print(f"Saving to brain artifact folder: {brain_dest}")
    img_cropped.save(brain_dest, "PNG")
    
    # Save to uploads directory
    print(f"Saving to live uploads directory: {uploads_dest}")
    os.makedirs(os.path.dirname(uploads_dest), exist_ok=True)
    img_cropped.save(uploads_dest, "PNG")
    
    print("Successfully processed and updated the image!")

if __name__ == "__main__":
    main()
