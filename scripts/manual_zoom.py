from PIL import Image

def manual_zoom_crop(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # We want to replicate CSS: scale-[2.0] and translate-y-2 (in a h-12=48px container)
        # scale 2.0 means we see 1/2 of the width and height.
        visible_width = width / 2.0
        visible_height = height / 2.0
        
        # Center point
        center_x = width / 2.0
        center_y = height / 2.0
        
        # Translate-y-2 logic:
        # In CSS, translate-y-2 shifts the IMAGE down by 0.5rem (8px).
        # The container is h-12 (3rem = 48px).
        # Shift ratio relative to container is 8/48 = 1/6.
        # Since the image is scaled 2x, the image dimension relative to container is 2x.
        # So a shift of 8px in container space corresponds to shifting the crop window UP.
        # 8px in 48px container is 16.6%.
        # In the original image space (before scaling), the visible height covers 50% of image.
        # The container "height" maps to visible_height.
        # So we need to shift the crop window up by (8/48) * visible_height.
        
        shift_y_ratio = 8.0 / 48.0
        shift_pixel = shift_y_ratio * visible_height
        
        # Define crop box
        # Left is center - half visible width
        # Top is center - half visible height - shift (minus because we shift crop UP to move image DOWN)
        left = center_x - (visible_width / 2.0)
        top = center_y - (visible_height / 2.0) - shift_pixel
        right = left + visible_width
        bottom = top + visible_height
        
        # Crop
        cropped = img.crop((left, top, right, bottom))
        
        # Resize back to original size (high quality)
        final_img = cropped.resize((width, height), Image.Resampling.LANCZOS)
        
        final_img.save(output_path)
        print(f"Saved manually zoomed icon to {output_path}")

    except Exception as e:
        print(f"Error: {e}")

# Use the base icon
manual_zoom_crop("public/sidebar-icon-only.png", "public/apple-touch-icon.png")
