import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_radial_gradient(width, height):
    # Center of gradient is at (width // 2, 80)
    cx, cy = width // 2, 80
    max_dist = math.sqrt((width // 2) ** 2 + (height - 80) ** 2)
    
    gradient = Image.new("RGBA", (width, height))
    
    # Center color: Off-white/pinkish-white #FFF5F3 -> (255, 245, 243)
    # Edge color: Warm peach #FEA682 -> (254, 166, 130)
    c_center = (255, 245, 243)
    c_edge = (254, 166, 130)
    
    for y in range(height):
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx * dx + dy * dy)
            t = min(dist / max_dist, 1.0)
            
            r = int(c_center[0] + (c_edge[0] - c_center[0]) * t)
            g = int(c_center[1] + (c_edge[1] - c_center[1]) * t)
            b = int(c_center[2] + (c_edge[2] - c_center[2]) * t)
            
            gradient.putpixel((x, y), (r, g, b, 255))
            
    return gradient

def remove_white_background(img):
    # Remove outer white background using flood fill starting from corners/edges
    w, h = img.size
    pixels = img.load()
    visited = set()
    
    # Seed queue with all edge pixels that are white-ish
    queue = []
    
    # Top and bottom edges
    for x in range(w):
        for y in [0, h - 1]:
            r, g, b, a = pixels[x, y]
            if r > 240 and g > 240 and b > 240:
                queue.append((x, y))
                visited.add((x, y))
                
    # Left and right edges
    for y in range(h):
        for x in [0, w - 1]:
            if (x, y) not in visited:
                r, g, b, a = pixels[x, y]
                if r > 240 and g > 240 and b > 240:
                    queue.append((x, y))
                    visited.add((x, y))
                    
    # Perform BFS flood fill
    while queue:
        cx, cy = queue.pop(0)
        # Make transparent
        pixels[cx, cy] = (255, 255, 255, 0)
        
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                r, g, b, a = pixels[nx, ny]
                if r > 240 and g > 240 and b > 240:
                    visited.add((nx, ny))
                    queue.append((nx, ny))
                    
    return img

def make_clean_badge(logo_image, is_apple=True):
    badge_size = 70
    card = Image.new("RGBA", (badge_size, badge_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    
    radius = 16
    draw.rounded_rectangle([2, 2, badge_size - 3, badge_size - 3], radius=radius, fill=(255, 255, 255, 255))
    
    lw, lh = logo_image.size
    px = (badge_size - lw) // 2
    py = (badge_size - lh) // 2
    card.paste(logo_image, (px, py), logo_image)
    
    # Shadow canvas
    shadow_padding = 15
    shadow_canvas_size = badge_size + shadow_padding * 2
    shadow_img = Image.new("RGBA", (shadow_canvas_size, shadow_canvas_size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_img)
    
    s_draw.rounded_rectangle(
        [shadow_padding + 2, shadow_padding + 5, shadow_canvas_size - shadow_padding - 3, shadow_canvas_size - shadow_padding],
        radius=radius,
        fill=(0, 0, 0, 45)
    )
    shadow_blurred = shadow_img.filter(ImageFilter.GaussianBlur(5))
    shadow_blurred.paste(card, (shadow_padding, shadow_padding), card)
    return shadow_blurred

def combine():
    dir_path = r"C:\Users\user\.gemini\antigravity-ide\brain\794c3113-af34-4208-9164-5b2791cf2094"
    ref_path = os.path.join(dir_path, "media__1779357434887.png")
    iphone_path = os.path.join(dir_path, "media__1779357488745.png")
    tablet_path = os.path.join(dir_path, "media__1779357520399.png")
    
    if not all(os.path.exists(p) for p in [ref_path, iphone_path, tablet_path]):
        print("Error: Missing one of the source images.")
        return
        
    ref_img = Image.open(ref_path).convert("RGBA")
    
    # Clean the device screenshot backgrounds
    print("Cleaning iPhone background...")
    iphone_img = remove_white_background(Image.open(iphone_path).convert("RGBA"))
    print("Cleaning Tablet background...")
    tablet_img = remove_white_background(Image.open(tablet_path).convert("RGBA"))
    
    # 1. Create Canvas
    width, height = 1024, 690
    canvas = create_radial_gradient(width, height)
    print("Created radial gradient canvas.")
    
    # 2. Crop background chevrons
    chevron_crop = ref_img.crop((0, 0, 260, height))
    fade_mask = Image.new("L", (260, height), 255)
    for x in range(200, 260):
        alpha = int(255 * (1.0 - (x - 200) / 60.0))
        for y in range(height):
            fade_mask.putpixel((x, y), alpha)
    canvas.paste(chevron_crop, (0, 0), fade_mask)
    print("Pasted background chevrons.")
    
    # 3. Apple Badge
    apple_crop_path = os.path.join(dir_path, "apple_badge_correct.png")
    if os.path.exists(apple_crop_path):
        apple_crop = Image.open(apple_crop_path).convert("RGBA")
        logo_apple = apple_crop.crop((25, 57, 57, 96))
        logo_apple_clean = Image.new("RGBA", logo_apple.size, (0, 0, 0, 0))
        for y in range(logo_apple.height):
            for x in range(logo_apple.width):
                r, g, b, a = logo_apple.getpixel((x, y))
                if r < 100 and g < 100 and b < 100:
                    logo_apple_clean.putpixel((x, y), (0, 0, 0, 255))
        apple_badge = make_clean_badge(logo_apple_clean, is_apple=True)
        print("Created clean Apple badge.")
    else:
        apple_badge = None
        
    # 4. Android Badge
    android_crop_path = os.path.join(dir_path, "android_badge_correct.png")
    if os.path.exists(android_crop_path):
        android_crop = Image.open(android_crop_path).convert("RGBA")
        logo_android = android_crop.crop((30, 30, 61, 64))
        logo_android_clean = Image.new("RGBA", logo_android.size, (0, 0, 0, 0))
        for y in range(logo_android.height):
            for x in range(logo_android.width):
                r, g, b, a = logo_android.getpixel((x, y))
                if g > 130 and r < 180 and b < 100:
                    logo_android_clean.putpixel((x, y), (164, 198, 57, 255))
        android_badge = make_clean_badge(logo_android_clean, is_apple=False)
        print("Created clean Android badge.")
    else:
        android_badge = None
        
    # 5. Resize device mockups
    t_h = 570
    t_w = int(461 * (t_h / 595))
    tablet_resized = tablet_img.resize((t_w, t_h), Image.Resampling.LANCZOS)
    
    ip_h = 550
    ip_w = int(324 * (ip_h / 553))
    iphone_resized = iphone_img.resize((ip_w, ip_h), Image.Resampling.LANCZOS)
    print(f"Resized mockups. Tablet: {t_w}x{t_h}, iPhone: {ip_w}x{ip_h}")
    
    # 6. Paste Tablet mockup
    tablet_x = 460
    tablet_y = 60
    canvas.paste(tablet_resized, (tablet_x, tablet_y), tablet_resized)
    
    # 7. Paste iPhone mockup
    iphone_x = 270
    iphone_y = 80
    canvas.paste(iphone_resized, (iphone_x, iphone_y), iphone_resized)
    print("Pasted clean mockups onto canvas.")
    
    # 8. Paste floating badges
    if apple_badge:
        canvas.paste(apple_badge, (240 - 15, 190 - 15), apple_badge)
    # Android badge: should float next to Tablet top-right
    if android_badge:
        # Reference Android badge card was at x=734, y=170.
        # Let's place it at x=810, y=230.
        # Relative to shadow canvas: place shadow canvas at x=810 - 15, y=230 - 15
        canvas.paste(android_badge, (810 - 15, 230 - 15), android_badge)
    print("Overlayed floating badges.")
    
    # 9. Save final composition
    output_path = os.path.join(dir_path, "mobile_app_promo_combined.png")
    canvas.save(output_path, "PNG")
    print(f"Successfully saved combined app promo image to: {output_path}")

if __name__ == "__main__":
    combine()
