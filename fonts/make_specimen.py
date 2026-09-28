"""Render the font proof using the actual TTF (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[1]
font=root/'dist/fonts/lumen-hand.ttf'
image=Image.new('RGB',(1280,900),'#f5f6fa')
draw=ImageDraw.Draw(image)
# Labels use Pillow's bundled UI font; every specimen below uses Lumen Hand.
draw.text((60,36),'Lumen Hand / Original ASCII handwriting',font=ImageFont.load_default(size=34),fill='#302954')
draw.text((60,90),'95 original printable characters. Drawn from pen paths; no source typeface.',font=ImageFont.load_default(size=19),fill='#646277')
rows=[('SIGNATURE','Made by intqwq@X',64),('UPPERCASE','ABCDEFGHIJKLMNOPQRSTUVWXYZ',43),('LOWERCASE','abcdefghijklmnopqrstuvwxyz',46),('NUMERALS','0123456789',48),('PUNCTUATION 01','! " # $ % & \' ( ) * + , - . /',42),('PUNCTUATION 02',': ; < = > ? @ [ \\ ] ^ _ ` { | } ~',42),('SMALL WATERMARK','Made by intqwq@X  |  The quick brown fox jumps over the lazy dog.',20)]
y=148
for label,text,size in rows:
    draw.text((60,y),label,font=ImageFont.load_default(size=14),fill='#79728f')
    draw.text((60,y+22),text,font=ImageFont.truetype(str(font),size),fill='#4433bb')
    y+=99
image.save(root/'fonts/specimen.png')
print('Saved fonts/specimen.png')
