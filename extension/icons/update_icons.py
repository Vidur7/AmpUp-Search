from PIL import Image
import os


def update_extension_icons():
    """
    Update Chrome extension icons with AmpUp logo

    This script expects 'ampup-logo.png' to be in the same directory
    and will generate the required sizes: 16x16, 48x48, and 128x128
    """

    # Source logo file (you need to place your AmpUp logo here)
    source_logo = "ampup-logo.png"

    # Required sizes for Chrome extension
    sizes = [16, 48, 128]

    if not os.path.exists(source_logo):
        print(f"❌ Error: {source_logo} not found!")
        print("Please save your AmpUp logo as 'ampup-logo.png' in this directory")
        print("Directory path: llmo-chrome-extension/extension/icons/")
        return

    try:
        # Open the source logo
        with Image.open(source_logo) as img:
            # Convert to RGBA if not already (for transparency support)
            if img.mode != "RGBA":
                img = img.convert("RGBA")

            # Generate each required size
            for size in sizes:
                # Resize the image maintaining aspect ratio
                resized = img.resize((size, size), Image.Resampling.LANCZOS)

                # Save the resized icon
                output_file = f"icon{size}.png"
                resized.save(output_file, "PNG")

                print(f"✅ Generated {output_file} ({size}x{size})")

        print("\n🎉 All extension icons updated successfully!")
        print("Your Chrome extension will now use the AmpUp logo!")

    except Exception as e:
        print(f"❌ Error updating icons: {e}")
        print("Make sure the source logo file is a valid PNG image")


if __name__ == "__main__":
    print("🔄 Updating Chrome Extension Icons with AmpUp Logo...")
    update_extension_icons()
