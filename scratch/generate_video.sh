
# Input image path
INPUT_IMAGE="/home/timothy/.gemini/antigravity/brain/e247ccc6-355f-49ca-8cfa-e1934119a05f/arch_arcane_background_wide_1778943533782.png"
OUTPUT_VIDEO="/home/timothy/Project/Arch-Mk2/assets/arch_arcane_loop.mp4"

# FFmpeg command to create a 10s loop with Ken Burns zoom and breathing glow
ffmpeg -loop 1 -i "$INPUT_IMAGE" \
    -vf "scale=2000:-1,zoompan=z='min(zoom+0.0005,1.5)':d=250:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080, \
         format=yuv420p" \
    -t 10 -c:v libx264 -pix_fmt yuv420p -preset slower -crf 18 "$OUTPUT_VIDEO" -y
