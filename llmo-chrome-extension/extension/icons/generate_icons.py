import cairosvg
import os


def generate_icons():
    sizes = [16, 48, 128]
    svg_file = "icon.svg"

    for size in sizes:
        output_file = f"icon{size}.png"
        cairosvg.svg2png(
            url=svg_file, write_to=output_file, output_width=size, output_height=size
        )
        print(f"Generated {output_file}")


if __name__ == "__main__":
    generate_icons()
