#!/usr/bin/env python3
import os
import sys
import shutil
import math
from PIL import Image, ImageDraw, ImageFont

# Configurations
WIDTH, HEIGHT = 1920, 1080
FPS = 60
DURATION_SEC = 4
TOTAL_FRAMES = FPS * DURATION_SEC  # 240 frames
TEMP_DIR = "scripts/temp_frames"
OUTPUT_PATH = "apps/portal/public/intro.mp4"

# Colors (RGBA)
CLR_VOID = (10, 11, 13, 255)
CLR_NEON_CYAN = (0, 242, 254, 255)
CLR_ORANGE = (255, 106, 0, 255)
CLR_RED_GLITCH = (255, 0, 85, 180)
CLR_CYAN_GLITCH = (0, 255, 230, 180)
CLR_WHITE = (255, 255, 255, 255)
CLR_GRAY_MUTED = (140, 150, 160, 255)

# Font selection
FONT_PATHS = [
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/ubuntu/UbuntuSans[wdth,wght].ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/katex/KaTeX_SansSerif-Bold.ttf"
]

def get_font(size):
    for path in FONT_PATHS:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_radial_glow(draw, center_x, center_y, max_radius):
    # Renders a subtle radial cyan glow to give 3D depth to the dark canvas
    glow_image = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_image)
    
    # Draw concentric circles with decreasing opacity
    steps = 40
    for r in range(max_radius, 0, -int(max_radius / steps)):
        alpha = int((1.0 - (r / max_radius) ** 2) * 20)  # Smooth quadratic falloff
        glow_draw.ellipse(
            [center_x - r, center_y - r, center_x + r, center_y + r],
            fill=(0, 242, 254, alpha)
        )
    return glow_image

def draw_grid(draw):
    # Fine tech grid lines (horizontal and vertical)
    grid_opacity = 8  # 0-255 scale (very subtle)
    
    for x in range(0, WIDTH, 80):
        draw.line([x, 0, x, HEIGHT], fill=(0, 242, 254, grid_opacity), width=1)
        
    for y in range(0, HEIGHT, 60):
        draw.line([0, y, WIDTH, y], fill=(0, 242, 254, grid_opacity), width=1)
        
    # Microscopic crosshairs at grid intersections
    for x in range(0, WIDTH, 240):
        for y in range(0, HEIGHT, 180):
            draw.line([x - 4, y, x + 4, y], fill=(0, 242, 254, grid_opacity * 2), width=1)
            draw.line([x, y - 4, x, y + 4], fill=(0, 242, 254, grid_opacity * 2), width=1)

def generate_frame(frame_idx):
    # Create master frame image
    img = Image.new("RGBA", (WIDTH, HEIGHT), CLR_VOID)
    draw = ImageDraw.Draw(img)
    
    # 1. Radial cyan depth glow
    glow = draw_radial_glow(draw, WIDTH // 2, HEIGHT // 2, 800)
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)  # Re-initialize draw overlay
    
    # 2. Fine Background Grid
    draw_grid(draw)
    
    # Coordinates and center details
    cx, cy = WIDTH // 2, HEIGHT // 2
    
    # Angles based on frame index for beautiful rotational offsets
    rot_dash = frame_idx * 1.2
    rot_ticks = -frame_idx * 0.6
    rot_arc = frame_idx * 2.0
    
    # 3. Rotating Tech Circles HUD (Concentric rings)
    # A. Rotating dashed concentric ring (Teal)
    r_dash = 220
    for angle in range(0, 360, 20):
        start = angle + rot_dash
        end = start + 10
        draw.arc(
            [cx - r_dash, cy - r_dash, cx + r_dash, cy + r_dash],
            start=start, end=end,
            fill=(0, 242, 254, 100), width=2
        )
        
    # B. Rotating precision ticks (Teal)
    r_ticks_inner = 250
    r_ticks_outer = 265
    for tick in range(0, 72):
        angle_rad = math.radians(tick * 5 + rot_ticks)
        cos_a = math.cos(angle_rad)
        sin_a = math.sin(angle_rad)
        x1 = cx + r_ticks_inner * cos_a
        y1 = cy + r_ticks_inner * sin_a
        x2 = cx + r_ticks_outer * cos_a
        y2 = cy + r_ticks_outer * sin_a
        draw.line([x1, y1, x2, y2], fill=(0, 242, 254, 60), width=2)
        
    # C. Inner solid telemetry ring (Orange)
    r_inner = 150
    draw.arc(
        [cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner],
        start=rot_arc, end=rot_arc + 140,
        fill=(255, 106, 0, 120), width=3
    )
    draw.arc(
        [cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner],
        start=rot_arc + 180, end=rot_arc + 320,
        fill=(255, 106, 0, 120), width=3
    )
    
    # 4. Premium Chromatic Aberration Typography
    font_title = get_font(72)
    font_sub = get_font(18)
    
    title_text = "ARCH-SYSTEMS"
    sub_text = "OPERATIONAL  PORTAL  MK-II"
    
    # Text bounds calculation for centering
    w_title = draw.textlength(title_text, font=font_title)
    w_sub = draw.textlength(sub_text, font=font_sub)
    
    tx, ty = cx - w_title // 2, cy - 36
    sx, sy = cx - w_sub // 2, cy + 60
    
    # Draw chromatic aberration offset text layers
    draw.text((tx - 3, ty), title_text, fill=CLR_RED_GLITCH, font=font_title)
    draw.text((tx + 3, ty), title_text, fill=CLR_CYAN_GLITCH, font=font_title)
    draw.text((tx, ty), title_text, fill=CLR_WHITE, font=font_title)
    
    # Subtitle
    draw.text((sx, sy), sub_text, fill=CLR_GRAY_MUTED, font=font_sub)
    
    # 5. Scanning Tech Laser Sweep Line
    # Laser sweep coordinates
    laser_y = (frame_idx * 14) % HEIGHT
    # Draw a thin hyper-laser scan line
    draw.line([0, laser_y, WIDTH, laser_y], fill=(0, 242, 254, 180), width=2)
    # Laser glow (slightly transparent bounding rectangles)
    draw.rectangle([0, laser_y - 8, WIDTH, laser_y + 8], fill=(0, 242, 254, 15))
    
    # 6. corner Diagnostic Telemetry logs
    font_mono = get_font(14)
    
    # Top Left Metadata
    draw.text((40, 40), "SYS_INTEGRITY: SECURED", fill=CLR_NEON_CYAN, font=font_mono)
    draw.text((40, 60), f"SYS_LATENCY: {1.2 + (frame_idx % 12) * 0.15:.2f}ms", fill=CLR_GRAY_MUTED, font=font_mono)
    draw.text((40, 80), f"FRAME_ID: {frame_idx:04d}", fill=CLR_GRAY_MUTED, font=font_mono)
    
    # Top Right Metadata
    draw.text((WIDTH - 240, 40), "SECURITY_CLEARANCE: L3", fill=CLR_ORANGE, font=font_mono)
    draw.text((WIDTH - 240, 60), "TUNNEL_CONN: STABLE", fill=CLR_GRAY_MUTED, font=font_mono)
    draw.text((WIDTH - 240, 80), "IP: 127.0.0.1 (LOCAL)", fill=CLR_GRAY_MUTED, font=font_mono)
    
    # Bottom Left Log stream
    log_text = "[  OK  ] INITIALIZING TELEMETRY STACK..."
    if frame_idx >= 60:
        log_text = "[  OK  ] SYNCING REDIS TRANSACTIONS..."
    if frame_idx >= 120:
        log_text = "[  OK  ] SECURING KONG API GATEWAY..."
    if frame_idx >= 180:
        log_text = "[  OK  ] AUTH SYSTEM ONLINE. DEPLOYING..."
        
    draw.text((40, HEIGHT - 60), log_text, fill=CLR_NEON_CYAN, font=font_mono)
    
    # 7. Loading Progress Slider Bar (Bottom Center)
    prog_w = 400
    prog_h = 4
    bx, by = cx - prog_w // 2, HEIGHT - 100
    
    # Slider background track
    draw.rectangle([bx, by, bx + prog_w, by + prog_h], fill=(0, 242, 254, 30))
    
    # Slider dynamic progress fill
    progress = min(1.0, frame_idx / (TOTAL_FRAMES - 40))  # Reaches 100% just before fade-out
    fill_w = int(prog_w * progress)
    draw.rectangle([bx, by, bx + fill_w, by + prog_h], fill=CLR_ORANGE)
    draw.ellipse([bx + fill_w - 4, by - 2, bx + fill_w + 4, by + 6], fill=CLR_NEON_CYAN) # Glowing slider point
    
    # 8. Master Cinematic Fade-In / Fade-Out Black Overlay
    # Master alpha calculations
    if frame_idx < 30:  # Smooth fade-in over 0.5s
        alpha = 1.0 - (frame_idx / 30.0)
    elif frame_idx > 180:  # Smooth fade-out over 1.0s to match auth layout fade
        alpha = (frame_idx - 180) / 60.0
    else:
        alpha = 0.0
        
    if alpha > 0.0:
        overlay = Image.new("RGBA", (WIDTH, HEIGHT), (10, 11, 13, int(alpha * 255)))
        img = Image.alpha_composite(img, overlay)
        
    return img.convert("RGB")

def main():
    print(f"Creating temp frames directory at: {TEMP_DIR}")
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    print("Generating 240 high-definition frames at 60fps...")
    for idx in range(TOTAL_FRAMES):
        frame = generate_frame(idx)
        frame_path = os.path.join(TEMP_DIR, f"frame_{idx:04d}.jpg")
        frame.save(frame_path, "JPEG", quality=95)
        if idx % 30 == 0:
            print(f"  -> Processed {idx}/{TOTAL_FRAMES} frames...")
            
    print("Frames generation complete! Compiling via FFmpeg...")
    
    # Build the output directory if missing
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    # Execute highly optimized FFmpeg h264 compression command
    ffmpeg_cmd = (
        f"ffmpeg -y -framerate 60 -i {TEMP_DIR}/frame_%04d.jpg "
        f"-c:v libx264 -profile:v high -level:v 4.2 -pix_fmt yuv420p "
        f"-crf 20 -movflags +faststart {OUTPUT_PATH}"
    )
    
    print(f"Executing: {ffmpeg_cmd}")
    status = os.system(ffmpeg_cmd)
    
    print("Cleaning up temporary frame assets...")
    shutil.rmtree(TEMP_DIR, ignore_errors=True)
    
    if status == 0:
        print(f"SUCCESS! Premium intro video created at: {OUTPUT_PATH}")
    else:
        print("ERROR: FFmpeg compilation failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
