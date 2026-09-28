"""Build Lumen Hand from original pen paths. No existing typeface is used.

Requires fonttools[woff], shapely and brotli. Run from any directory.
The hand-authored coordinates use a 100-unit sketch space, baseline at y=78.
"""
import math
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.basePen import BasePen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.svgLib.path import parse_path
from shapely.geometry import Point, Polygon
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

# (advance, original pen strokes). Curves intentionally differ between letters.
GLYPHS = {
    ' ': (30, ''),
    '!': (22, 'M11 9 Q8 30 9 53 M9 72 L9.3 73'),
    '"': (32, 'M8 8 L6 25 M24 7 L21 24'),
    '#': (58, 'M20 12 L11 81 M43 9 L34 79 M3 37 L53 34 M0 59 L50 57'),
    '$': (52, 'M45 22 C28 4 5 15 8 32 C11 48 44 41 43 61 C42 81 14 84 3 68 M30 0 L20 93'),
    '%': (66, 'M55 8 L7 80 M15 9 C0 9 0 33 12 33 C27 33 28 8 15 9 M49 54 C35 53 33 78 47 79 C62 79 63 55 49 54'),
    '&': (65, 'M56 42 C42 78 24 88 9 71 C-3 56 10 44 24 32 C43 16 34 1 20 10 C1 25 18 49 57 79'),
    "'": (17, 'M9 7 L6 24'),
    '(': (31, 'M24 0 C-1 25 -2 67 19 95'),
    ')': (31, 'M7 0 C31 25 29 68 5 95'),
    '*': (43, 'M21 12 L18 44 M4 22 L35 34 M35 17 L6 40'),
    '+': (53, 'M25 27 L23 71 M3 50 L46 47'),
    ',': (19, 'M10 72 Q12 82 3 90'),
    '-': (40, 'M5 50 Q20 48 33 49'),
    '.': (18, 'M8 74 L8.3 74.3'),
    '/': (43, 'M37 2 Q19 42 4 88'),
    '0': (55, 'M28 8 C1 2 -4 76 23 79 C52 83 57 7 28 8'),
    '1': (37, 'M3 24 L22 9 Q19 43 17 76 M5 78 L32 77'),
    '2': (53, 'M4 25 C5 -1 46 1 45 25 C44 42 13 60 5 78 Q26 74 46 77'),
    '3': (52, 'M4 15 C21 1 50 10 39 29 Q31 40 20 40 C57 36 54 82 24 80 Q9 80 3 68'),
    '4': (55, 'M32 8 Q16 35 3 52 L50 51 M39 10 L34 80'),
    '5': (53, 'M47 10 L11 11 L7 41 C31 27 51 43 43 63 C37 85 13 86 3 70'),
    '6': (54, 'M43 12 C17 -7 -6 48 9 71 C24 96 53 73 44 51 C38 35 14 36 7 53'),
    '7': (50, 'M2 11 Q27 7 46 10 Q25 43 17 80 M10 43 L37 40'),
    '8': (54, 'M26 8 C-2 8 1 35 25 43 C52 51 45 82 21 79 C-5 76 -1 50 25 43 C51 34 52 5 26 8'),
    '9': (54, 'M44 37 C47 4 13 0 6 24 C-3 53 28 61 43 35 C41 61 31 84 9 78'),
    ':': (18, 'M9 39 L9.4 39.3 M7 72 L7.4 72.3'),
    ';': (20, 'M10 38 L10.4 38.3 M9 71 Q11 82 2 90'),
    '<': (48, 'M39 27 L5 50 L36 72'),
    '=': (50, 'M5 40 L43 39 M4 59 L41 58'),
    '>': (48, 'M5 27 L39 49 L3 74'),
    '?': (49, 'M3 24 C3 3 40 0 42 22 C45 39 20 43 20 57 M19 74 L19.4 74.3'),
    '@': (80, 'M51 35 C34 18 13 65 35 68 Q47 67 50 42 L53 31 M50 42 C39 79 68 74 69 42 C71 8 30 -1 10 24 C-13 52 2 92 34 94 Q53 95 66 84'),
    'A': (64, 'M1 79 Q17 41 34 8 Q46 39 56 78 M12 53 Q33 49 47 51'),
    'B': (59, 'M9 78 Q10 40 12 10 C39 1 55 12 46 29 Q39 39 13 43 C63 31 65 81 10 78'),
    'C': (61, 'M54 19 C18 -13 -10 39 8 67 C20 88 39 80 53 69'),
    'D': (62, 'M9 77 L12 10 C64 -2 72 78 10 78'),
    'E': (52, 'M46 10 L12 11 L7 79 L45 77 M10 43 L37 41'),
    'F': (52, 'M9 79 L13 11 L47 10 M11 43 L39 41'),
    'G': (64, 'M56 19 C26 -10 -1 14 4 53 C8 91 53 84 55 48 L33 48'),
    'H': (62, 'M11 10 L7 79 M52 8 L46 79 M9 43 Q30 39 49 43'),
    'I': (35, 'M6 11 L31 9 M20 11 L15 77 M2 78 L28 76'),
    'J': (47, 'M17 11 L44 9 M34 10 L30 61 C27 87 3 86 1 65'),
    'K': (60, 'M11 9 L7 80 M53 8 L9 47 M27 33 Q37 56 54 77'),
    'L': (50, 'M13 9 L7 78 Q27 76 44 78'),
    'M': (78, 'M4 79 L13 9 L34 52 L60 8 L67 79'),
    'N': (67, 'M7 79 L12 10 Q36 43 51 77 L57 7'),
    'O': (64, 'M33 8 C-2 5 -8 72 25 79 C63 85 70 8 33 8'),
    'P': (58, 'M8 79 L12 11 C61 -4 65 51 10 44'),
    'Q': (66, 'M33 8 C-1 4 -8 74 27 79 C63 84 70 8 33 8 M35 61 L58 88'),
    'R': (62, 'M8 79 L12 11 C61 -3 62 47 11 43 M29 43 Q41 63 55 78'),
    'S': (56, 'M49 19 C28 -3 2 10 7 30 C12 46 49 39 48 61 C46 83 14 87 2 68'),
    'T': (60, 'M3 12 Q28 8 55 10 M30 12 L25 79'),
    'U': (63, 'M11 10 L7 55 C3 89 47 89 50 56 L54 9'),
    'V': (60, 'M5 10 Q12 47 25 78 L54 8'),
    'W': (87, 'M5 10 L17 78 L41 32 L52 79 L79 8'),
    'X': (59, 'M8 11 L49 78 M51 8 L3 80'),
    'Y': (60, 'M5 9 L27 45 L54 7 M27 45 L23 79'),
    'Z': (56, 'M6 12 L50 9 L4 78 L49 76'),
    '[': (30, 'M24 2 L10 3 L5 94 L20 94'),
    '\\': (43, 'M6 3 Q22 44 35 88'),
    ']': (30, 'M7 2 L23 3 L17 94 L3 94'),
    '^': (49, 'M5 36 L25 9 L43 35'),
    '_': (55, 'M2 92 Q28 90 51 91'),
    '`': (24, 'M5 5 L18 21'),
    'a': (49, 'M38 41 C19 19 0 48 8 68 C17 90 38 70 39 37 M39 35 Q31 78 46 76'),
    'b': (49, 'M10 78 Q11 32 16 2 M12 47 C31 18 51 37 41 63 C32 86 11 79 10 65'),
    'c': (43, 'M36 41 C17 19 -1 43 6 65 C12 82 26 80 37 70'),
    'd': (50, 'M39 41 C20 20 0 47 8 68 C17 89 39 69 40 38 M45 2 Q32 76 47 76'),
    'e': (46, 'M7 55 C44 57 46 27 23 34 C-1 42 2 82 28 77 Q36 75 40 69'),
    'f': (37, 'M30 9 C11 -8 13 20 10 46 L6 95 M1 39 L31 35'),
    'g': (49, 'M38 42 C19 19 0 47 8 68 C19 90 39 63 39 36 L34 88 C29 111 1 103 6 89'),
    'h': (49, 'M9 78 L16 2 M11 51 C34 16 43 33 37 58 Q32 80 45 75'),
    'i': (22, 'M12 35 Q5 80 19 75 M15 17 L15.4 17.4'),
    'j': (26, 'M17 34 L10 88 Q6 109 -7 96 M20 16 L20.4 16.4'),
    'k': (47, 'M9 79 L16 2 M40 32 L11 58 M26 46 Q29 65 43 77'),
    'l': (23, 'M15 2 Q3 76 18 77'),
    'm': (73, 'M9 35 L4 78 M8 51 C22 24 36 28 30 55 L26 77 M30 52 C47 22 64 30 57 58 Q54 79 67 75'),
    'n': (50, 'M10 35 L5 78 M9 51 C26 23 44 30 38 57 Q33 82 46 75'),
    'o': (48, 'M26 34 C3 27 -2 72 18 78 C42 84 51 32 26 34'),
    'p': (49, 'M11 34 L5 101 M11 47 C30 20 50 40 40 64 C32 84 13 80 9 66'),
    'q': (49, 'M38 41 C19 18 0 48 8 68 C18 89 39 66 39 35 L32 101 M32 97 L45 86'),
    'r': (36, 'M10 35 L5 78 M9 51 Q20 29 32 37'),
    's': (40, 'M33 40 C20 24 0 38 10 49 C18 57 38 53 32 68 C26 83 9 81 2 70'),
    't': (33, 'M18 14 L11 60 Q7 82 27 74 M2 39 L31 36'),
    'u': (50, 'M11 35 C-5 90 25 90 38 41 M40 34 Q30 79 46 75'),
    'v': (43, 'M6 36 Q7 61 16 78 Q31 61 37 33'),
    'w': (66, 'M6 36 L13 77 Q24 65 30 46 L39 78 Q54 60 59 33'),
    'x': (45, 'M7 36 Q22 51 37 77 M38 34 L3 80'),
    'y': (47, 'M8 35 Q8 85 35 59 M40 33 C33 71 25 112 6 98'),
    'z': (43, 'M7 37 L36 35 Q19 58 4 77 L37 75'),
    '{': (33, 'M27 1 C6 -1 19 34 5 44 Q-3 49 9 52 C19 56 -1 94 22 95'),
    '|': (17, 'M11 1 L6 97'),
    '}': (33, 'M7 1 C28 0 15 33 27 43 Q38 49 24 53 C14 57 32 94 8 95'),
    '~': (56, 'M3 52 Q13 37 27 49 Q40 62 49 44'),
}

# Two complete signatures: each is authored as a word-sized design instead of
# concatenating the individual font characters. Private-use codepoints keep the
# presets distinct from normal editable text; their visible names stay in the UI.
SIGNATURES = {
    # Compact connected letter bodies, an extended looped ascender and two
    # individual descenders. The last q flows into a long, returning flourish.
    0xE000: (297, '''
        M-17 67 C-9 72 9 53 20 42 C25 36 27 34 24 41
        L12 65 C7 78 20 77 35 52
        M36 45 C35 53 29 66 27 73 C36 56 52 38 59 43
        C65 49 47 67 51 71 C57 77 73 58 79 47
        C88 29 103 -3 98 -9 C88 -23 69 36 68 59
        C67 77 83 70 95 53
        C103 37 127 35 119 51 C110 72 94 78 94 66
        C94 53 107 39 120 43
        M124 39 C115 62 102 92 99 105 C96 119 111 111 124 91
        C136 72 143 50 143 42
        C139 54 132 72 140 71 C148 70 160 51 165 43
        C158 59 153 71 161 69 C168 68 180 48 184 40
        C179 52 179 60 187 53
        C196 40 216 31 211 45 C207 57 190 75 185 65
        C181 55 198 36 212 40
        M216 36 C206 61 191 94 193 104
        C197 121 230 99 241 85 C263 53 287 79 252 92
        C219 105 143 111 64 102 C8 97 -17 86 7 83
        C42 78 102 98 157 94 C205 91 245 74 274 65
        M27 23 C32 13 38 17 32 22
        M47 36 C83 29 125 20 160 19
        '''),
    # 行草-inspired pen movement: compressed radicals, open counters, rising
    # joins and a sweeping final vertical. These paths are authored for this
    # name alone, rather than slanting three typeset Chinese characters.
    0xE001: (332, '''
        M3 15 C17 37 31 26 46 5
        M-11 39 C6 34 30 26 45 27
        M30 -4 C30 14 12 43 -6 54
        M17 33 C38 39 42 53 31 57 C21 61 3 68 -5 72
        C8 65 27 62 39 62 C34 78 14 98 -7 100
        M18 52 C13 63 6 76 4 82 C20 86 27 92 31 98
        M72 -1 C73 19 55 44 45 50
        M57 29 C72 23 88 19 96 20 C86 28 83 42 76 60
        C64 92 40 108 27 102 C14 92 49 72 73 67
        M51 43 C62 67 77 87 101 87 C112 87 116 73 119 55
        C123 31 130 11 141 2 C150 -7 181 -10 207 -7
        M137 7 C136 32 122 78 111 95
        M164 7 C168 13 157 24 145 33
        M143 36 C142 54 136 68 140 65 C150 61 170 62 185 53
        C188 42 193 27 190 23 C182 20 158 27 143 36
        M140 49 C153 43 171 39 184 39
        M165 57 C170 61 167 83 152 94 C141 101 139 94 149 86
        M143 73 C139 80 128 88 123 87
        M181 65 C190 65 198 72 196 79 C194 88 204 89 213 78
        M243 -5 C247 1 232 20 218 28
        M246 21 C242 33 224 51 212 55 C221 51 232 44 235 39
        C235 53 221 84 223 91 C225 96 238 82 244 70
        M252 13 C269 7 295 2 307 5 C312 10 302 31 298 39
        C283 41 268 45 250 49
        M244 32 C266 23 296 18 321 21
        M251 61 C264 55 289 51 304 51
        M241 76 C261 68 298 64 310 65
        M283 -20 C289 -7 278 25 275 44 C268 71 260 104 270 106
        C285 110 319 73 329 55 C337 38 318 58 304 74
        C269 111 185 114 112 106 C67 101 45 102 40 111
        M56 119 C103 113 157 122 220 115
        '''),
}


class SketchPen(BasePen):
    def __init__(self):
        super().__init__(None)
        self.paths = []

    def _moveTo(self, pt):
        self.paths.append([pt])

    def _lineTo(self, pt):
        start = self.paths[-1][-1]
        n = max(1, math.ceil(math.dist(start, pt) / 2))
        self.paths[-1].extend(tuple(a+(b-a)*i/n for a,b in zip(start,pt)) for i in range(1,n+1))

    def _curveToOne(self, p1, p2, p3):
        p0 = self.paths[-1][-1]
        for i in range(1,33):
            t=i/32; u=1-t
            self.paths[-1].append(tuple(u**3*p0[j]+3*u*u*t*p1[j]+3*u*t*t*p2[j]+t**3*p3[j] for j in range(2)))

    def _qCurveToOne(self, p1, p2):
        p0=self.paths[-1][-1]
        for i in range(1,25):
            t=i/24;u=1-t
            self.paths[-1].append(tuple(u*u*p0[j]+2*u*t*p1[j]+t*t*p2[j] for j in range(2)))

    def _closePath(self):
        self._lineTo(self.paths[-1][0])

    def _endPath(self):
        pass


def outline(character, path):
    pen=SketchPen();parse_path(path,pen)
    shapes=[]
    for index,stroke in enumerate(pen.paths):
        # Curves can have long steps near their ends. Resample the whole stroke
        # before expanding it so even tall ascenders form one continuous stroke.
        dense=[stroke[0]]
        for start,end in zip(stroke,stroke[1:]):
            steps=max(1,math.ceil(math.dist(start,end)/(.35 if ord(character) in SIGNATURES else 1.2)))
            dense.extend(tuple(a+(b-a)*i/steps for a,b in zip(start,end)) for i in range(1,steps+1))
        stroke=dense
        closed=math.dist(stroke[0],stroke[-1]) < 1
        # Modest pressure variation and a slight right lean, not random jitter.
        discs=[]
        phase=(ord(character)%7)*.23+index*.4
        for i,(x,y) in enumerate(stroke):
            t=i/max(1,len(stroke)-1)
            taper=1 if closed else .84+.16*math.sin(math.pi*t)
            if ord(character) in SIGNATURES:
                # A flexible pointed pen: hairline upward/sideways movement,
                # pressure on downstrokes, tapered starts and lifted endings.
                before=stroke[max(0,i-3)];after=stroke[min(len(stroke)-1,i+3)]
                length=max(.001,math.dist(before,after))
                down=max(0,(after[1]-before[1])/length)
                pressure=.30+1.8*down**1.25
                taper=.30+.70*min(1,t*20,(1-t)*16)
                radius=pressure*taper*(1+.08*math.sin(3*math.pi*t+phase))
                lean=.19
            else:
                radius=2.45*taper*(1+.07*math.sin(2*math.pi*t+phase))
                lean=.09
            discs.append(Point((x+lean*(78-y))*10,(78-y)*10).buffer(radius*10,quad_segs=5))
        shapes.append(unary_union(discs))
    return unary_union(shapes).buffer(0).simplify(.8,preserve_topology=True)


def make_glyph(character, advance, path):
    pen=TTGlyphPen(None)
    if not path:
        return pen.glyph(), (advance*10, 0)
    shape=outline(character,path)
    offset=45-shape.bounds[0]
    for polygon in ([shape] if isinstance(shape,Polygon) else shape.geoms):
        polygon=orient(polygon,sign=-1)
        for ring in [polygon.exterior,*polygon.interiors]:
            points=[(round(x+offset),round(y)) for x,y in list(ring.coords)[:-1]]
            pen.moveTo(points[0])
            for point in points[1:]:pen.lineTo(point)
            pen.closePath()
    width=max(round(advance*10),round(shape.bounds[2]+offset+45))
    return pen.glyph(),(width,45)


def build():
    assert set(GLYPHS)==set(map(chr,range(32,127))), 'Every printable ASCII glyph must be authored.'
    root=Path(__file__).resolve().parents[1]
    target=root/'dist/fonts';target.mkdir(parents=True,exist_ok=True)
    names={code:f'uni{code:04X}' for code in [*range(32,127),*SIGNATURES]}
    builder=FontBuilder(1000,isTTF=True)
    builder.setupGlyphOrder(['.notdef',*names.values()])
    glyphs={};metrics={}
    glyphs['.notdef'],metrics['.notdef']=make_glyph('?',50,'M6 5 L39 5 L39 78 L6 78 Z M7 6 L38 77')
    for code,name in names.items():glyphs[name],metrics[name]=make_glyph(chr(code),*(SIGNATURES[code] if code in SIGNATURES else GLYPHS[chr(code)]))
    builder.setupCharacterMap(names)
    builder.setupGlyf(glyphs)
    builder.setupHorizontalMetrics(metrics)
    builder.setupHorizontalHeader(ascent=1050,descent=-450)
    builder.setupNameTable({'familyName':'Lumen Hand','styleName':'Regular','uniqueFontIdentifier':'WatermarkStudio-LumenHand-1.200','fullName':'Lumen Hand Regular','psName':'LumenHand-Regular','version':'Version 1.200','designer':'Watermark Studio','description':'Original ASCII pen paths plus intqwq and Shu Yuan Lv pointed-pen signatures. See fonts/README.md for source.','copyright':'Copyright 2026 Watermark Studio.'})
    builder.setupOS2(sTypoAscender=1050,sTypoDescender=-450,sTypoLineGap=0,usWinAscent=1050,usWinDescent=450,sxHeight=460,sCapHeight=700,fsType=0)
    builder.setupPost(italicAngle=-5)
    builder.setupMaxp()
    builder.font['head'].created=builder.font['head'].modified=3873484800
    builder.font.recalcTimestamp=False
    builder.save(target/'lumen-hand.ttf')
    builder.font.flavor='woff2';builder.save(target/'lumen-hand.woff2')
    print('Built original Lumen Hand: 95 printable ASCII glyphs + 2 cursive signatures, TTF + WOFF2.')


if __name__=='__main__':
    build()
