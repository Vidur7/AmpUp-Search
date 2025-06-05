from PIL import Image, ImageDraw, ImageFont
import os


def generate_icons():
    sizes = [16, 48, 128]

    for size in sizes:
        # Create a new image with gradient background
        img = Image.new("RGB", (size, size), "#667eea")
        draw = ImageDraw.Draw(img)

        # Calculate font size (approximately 60% of image size)
        font_size = int(size * 0.6)
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()

        # Calculate text position to center it
        text = "L"
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        x = (size - text_width) // 2
        y = (size - text_height) // 2

        # Draw the text
        draw.text((x, y), text, fill="white", font=font)

        # Save the image
        output_file = f"icon{size}.png"
        img.save(output_file)
        print(f"Generated {output_file}")


if __name__ == "__main__":
    generate_icons()
