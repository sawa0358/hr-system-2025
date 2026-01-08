from PIL import Image, ImageOps

def create_full_bleed_icon(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        
        # 1. Trim whitespace accurately
        # Convert to grayscale and invert to find bounding box of non-white content
        # Assuming background is white/transparent
        bg = Image.new(img.mode, img.size, (255, 255, 255))
        diff = ImageOps.difference(img.convert("RGB"), bg.convert("RGB"))
        bbox = diff.getbbox()
        
        if bbox:
            cropped = img.crop(bbox)
            print(f"Content bbox found: {bbox}")
        else:
            print("No content found, using full image.")
            cropped = img
            
        # 2. Resize to fill a square canvas
        # Target size
        target_size = (1024, 1024)
        canvas = Image.new("RGBA", target_size, (255, 255, 255, 255)) # White background
        
        # Calculate aspect ratio preserving resize
        # We want the logo to fill the canvas significantly
        # Let's leave a very small padding (e.g. 5%) so it doesn't touch edges uncomfortably,
        # OR go full bleed if that's the request. 
        # User said "いっぱいの大きさ" (full size), so minimal padding.
        
        padding = 50 # 50px padding on 1024px image is small (~5%)
        max_dim = 1024 - (padding * 2)
        
        content_width, content_height = cropped.size
        ratio = min(max_dim / content_width, max_dim / content_height)
        
        new_w = int(content_width * ratio)
        new_h = int(content_height * ratio)
        
        resized_content = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center on canvas
        offset_x = (1024 - new_w) // 2
        offset_y = (1024 - new_h) // 2
        
        canvas.paste(resized_content, (offset_x, offset_y), resized_content)
        
        canvas.save(output_path)
        print(f"Saved full bleed icon to {output_path}")

    except Exception as e:
        print(f"Error: {e}")

# Apply to apple-touch-icon
create_full_bleed_icon("public/sidebar-icon-only.png", "public/apple-touch-icon.png")
