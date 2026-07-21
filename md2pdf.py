#!/usr/bin/env python3
"""Modern, professional SOP.md -> SOP.pdf converter (A4). Bug-free."""
import re
import html as _html
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Preformatted,
    Table, TableStyle, HRFlowable, ListFlowable, ListItem,
    PageBreak, NextPageTemplate, CondPageBreak,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register a monospace font with box-drawing glyph support for tree rendering
_MONO_FONT = 'Courier'
for _candidate in ('Consolas', 'LucidaConsole'):
    try:
        pdfmetrics.registerFont(TTFont(_candidate, r'C:\Windows\Fonts\consola.ttf'
                                       if _candidate == 'Consolas'
                                       else r'C:\Windows\Fonts\lucon.ttf'))
        _MONO_FONT = _candidate
        break
    except Exception:
        continue

# ---------- Theme ----------
NAVY = HexColor('#1a2b4a')
CRIMSON = HexColor('#9b1c2e')
SAFFRON = HexColor('#e08a1e')
GOLD = HexColor('#c9a227')
LIGHT = HexColor('#f4f1ea')
ACCENT = HexColor('#2c5282')
TEXT = HexColor('#222831')
MUTE = HexColor('#5b6470')
CODE_BG = HexColor('#1e2733')
CODE_FG = HexColor('#e6edf3')
RULE = HexColor('#d8d2c4')

# A4 usable width (with 20mm margins) in points
PAGE_W, PAGE_H = A4
USABLE_W = PAGE_W - 40*mm  # ~515 pt

def esc(s):
    return _html.escape(s, quote=False)

# ---------- Styles ----------
ss = {}
ss['title'] = ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=30,
                             textColor=NAVY, leading=34, spaceAfter=6,
                             alignment=TA_CENTER)
ss['subtitle'] = ParagraphStyle('subtitle', fontName='Helvetica', fontSize=14,
                                textColor=CRIMSON, leading=18, alignment=TA_CENTER)
ss['meta'] = ParagraphStyle('meta', fontName='Helvetica', fontSize=10.5,
                            textColor=MUTE, leading=16, alignment=TA_CENTER)
ss['h1'] = ParagraphStyle('h1', fontName='Helvetica-Bold', fontSize=17,
                          textColor=NAVY, leading=20, spaceBefore=14, spaceAfter=6)
ss['h2'] = ParagraphStyle('h2', fontName='Helvetica-Bold', fontSize=13.5,
                          textColor=ACCENT, leading=17, spaceBefore=11, spaceAfter=4)
ss['h3'] = ParagraphStyle('h3', fontName='Helvetica-Bold', fontSize=11.5,
                          textColor=TEXT, leading=15, spaceBefore=9, spaceAfter=3)
ss['h4'] = ParagraphStyle('h4', fontName='Helvetica-BoldOblique', fontSize=10.5,
                          textColor=MUTE, leading=14, spaceBefore=7, spaceAfter=2)
ss['body'] = ParagraphStyle('body', fontName='Helvetica', fontSize=10,
                            textColor=TEXT, leading=14.5, alignment=TA_LEFT,
                            spaceAfter=5)
ss['bullet'] = ParagraphStyle('bullet', parent=ss['body'], spaceAfter=2,
                              alignment=TA_LEFT)
ss['code'] = ParagraphStyle('code', fontName='Courier', fontSize=8.4,
                            textColor=CODE_FG, leading=11.5, backColor=CODE_BG,
                            borderPadding=8, leftIndent=4, rightIndent=4)
ss['callout'] = ParagraphStyle('callout', fontName='Helvetica', fontSize=9.5,
                               textColor=TEXT, leading=13.5, leftIndent=12,
                               rightIndent=12, spaceAfter=2)
ss['th'] = ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=10,
                          textColor=white, leading=14)
ss['toc1'] = ParagraphStyle('toc1', fontName='Helvetica-Bold', fontSize=10.5,
                            textColor=NAVY, leading=18, leftIndent=0)
ss['toc2'] = ParagraphStyle('toc2', fontName='Helvetica', fontSize=9.5,
                            textColor=TEXT, leading=15, leftIndent=14)
ss['toc3'] = ParagraphStyle('toc3', fontName='Helvetica-Oblique', fontSize=9,
                            textColor=MUTE, leading=13, leftIndent=28)

def normalize_text(s):
    """Replace smart punctuation that Helvetica can't render with ASCII equivalents."""
    return (s.replace('\u2014', ' - ').replace('\u2013', ' - ')
             .replace('\u2018', "'").replace('\u2019', "'")
             .replace('\u201c', '"').replace('\u201d', '"')
             .replace('\u2026', '...').replace('\u00a0', ' ')
             .replace('\u2192', '->').replace('\u2022', '-')
             .replace('\u2013', '-'))

def inline(txt):
    txt = normalize_text(txt)
    # Protect code spans first
    codes = []
    def stash(m):
        codes.append(m.group(1))
        return '\x00CODE%d\x00' % (len(codes) - 1)
    txt = re.sub(r'`([^`]+?)`', stash, txt)
    # Convert markdown links [text](url) -> text (after protecting code)
    txt = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', txt)
    txt = esc(txt)
    txt = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', txt)
    txt = re.sub(r'(?<!\*)\*([^*\n]+?)\*(?!\*)', r'<i>\1</i>', txt)
    def unstash(m):
        idx = int(m.group(1))
        c = esc(codes[idx])
        return '<font face="Courier" color="#9b1c2e">%s</font>' % c
    txt = re.sub(r'\x00CODE(\d+)\x00', unstash, txt)
    return txt

def wrap_code_line(line, max_w):
    """Wrap a single code line to fit max_w points using Courier font size 8.4."""
    if stringWidth(line, 'Courier', 8.4) <= max_w:
        return [line]
    out = []
    cur = ''
    for ch in line:
        if stringWidth(cur + ch, 'Courier', 8.4) > max_w:
            out.append(cur)
            cur = ch
        else:
            cur += ch
    if cur:
        out.append(cur)
    return out

def wrap_code_block(code):
    """Wrap all lines of a code block to fit within usable width."""
    # code block has borderPadding=8 on each side + leftIndent/rightIndent=4
    max_w = USABLE_W - 24
    out = []
    for ln in code:
        if ln.strip() == '':
            out.append('')
        else:
            out.extend(wrap_code_line(ln, max_w))
    return '\n'.join(out)

# ---------- Document ----------
class SOPDoc(BaseDocTemplate):
    def __init__(self, fn, **kw):
        super().__init__(fn, pagesize=A4,
                         leftMargin=20*mm, rightMargin=20*mm,
                         topMargin=20*mm, bottomMargin=18*mm, **kw)
        frame = Frame(self.leftMargin, self.bottomMargin,
                      self.width, self.height, id='main')
        self.addPageTemplates([
            PageTemplate(id='cover', frames=[frame], onPage=self._cover_bg),
            PageTemplate(id='content', frames=[frame],
                         onPage=self._header_footer),
        ])

    def _cover_bg(self, canvas, doc):
        canvas.saveState()
        w, h = A4
        canvas.setFillColor(NAVY)
        canvas.rect(0, h-70*mm, w, 70*mm, fill=1, stroke=0)
        canvas.setFillColor(CRIMSON)
        canvas.rect(0, h-72*mm, w, 2*mm, fill=1, stroke=0)
        canvas.setFillColor(SAFFRON)
        canvas.rect(0, 0, w, 14*mm, fill=1, stroke=0)
        canvas.setFillColor(GOLD)
        canvas.rect(0, 14*mm, w, 1.2*mm, fill=1, stroke=0)
        canvas.restoreState()

    def _header_footer(self, canvas, doc):
        canvas.saveState()
        w, h = A4
        canvas.setFillColor(NAVY)
        canvas.rect(0, h-12*mm, w, 12*mm, fill=1, stroke=0)
        canvas.setFillColor(white)
        canvas.setFont('Helvetica-Bold', 8.5)
        canvas.drawString(20*mm, h-8*mm, 'JINDA POS PLATFORM')
        canvas.setFont('Helvetica', 8)
        canvas.drawRightString(w-20*mm, h-8*mm, 'Standard Operating Procedure')
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        canvas.line(20*mm, 14*mm, w-20*mm, 14*mm)
        canvas.setFillColor(MUTE)
        canvas.setFont('Helvetica', 8)
        canvas.drawString(20*mm, 9.5*mm, 'Jinda POS - Operations Guide v1.0')
        canvas.drawRightString(w-20*mm, 9.5*mm, 'Page %d' % doc.page)
        canvas.setFillColor(SAFFRON)
        canvas.rect(0, 0, w, 1.2*mm, fill=1, stroke=0)
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if hasattr(flowable, '_toc'):
            level, txt = flowable._toc
            self.notify('TOCEntry', (level, txt, self.page))

def make_callout(text, kind='note'):
    colors = {
        'note': (HexColor('#e8f0fe'), ACCENT),
        'warning': (HexColor('#fdecec'), CRIMSON),
        'tip': (HexColor('#eafaf1'), HexColor('#1e7d4f')),
        'security': (HexColor('#fff4e5'), SAFFRON),
    }
    bg, bar = colors.get(kind, colors['note'])
    p = Paragraph(inline(text), ss['callout'])
    t = Table([[p]], colWidths=[USABLE_W])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('LINEBEFORE', (0, 0), (0, -1), 3, bar),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('BOX', (0, 0), (-1, -1), 0.5, RULE),
    ]))
    return t

def strip_tags(txt):
    """Remove HTML tags from text for width measurement."""
    return re.sub(r'<[^>]+>', '', txt)

def compute_col_widths(raw_rows, n):
    """Compute column widths from raw markdown text, based on longest word."""
    # For each column, find the longest word (to prevent word-breaking)
    col_max_word = [0]*n
    col_max_line = [0]*n
    for r in raw_rows:
        cells = [c.strip() for c in r.strip().strip('|').split('|')]
        for ci, c in enumerate(cells[:n]):
            plain = strip_tags(inline(c))
            # longest word
            words = plain.split()
            for w in words:
                wlen = stringWidth(w, 'Helvetica', 9)
                if wlen > col_max_word[ci]:
                    col_max_word[ci] = wlen
            # longest line
            llen = stringWidth(plain, 'Helvetica', 9)
            if llen > col_max_line[ci]:
                col_max_line[ci] = llen
    # Each column needs at least: longest word + padding (16) 
    min_widths = [col_max_word[ci] + 16 for ci in range(n)]
    # If all min widths fit, distribute remaining by max line length
    total_min = sum(min_widths)
    avail = USABLE_W
    if total_min >= avail:
        # Can't fit - scale down but keep proportional, allow word break
        scale = avail / total_min
        return [max(min_widths[ci]*scale, 30) for ci in range(n)]
    # Distribute remaining space proportionally to max line length
    remaining = avail - total_min
    total_line = sum(max(col_max_line[ci], min_widths[ci]) for ci in range(n))
    widths = []
    for ci in range(n):
        extra = remaining * (max(col_max_line[ci], min_widths[ci]) / total_line) if total_line > 0 else 0
        widths.append(min_widths[ci] + extra)
    # Normalize to exact usable width
    cur = sum(widths)
    if cur > avail:
        widths = [w * avail / cur for w in widths]
    return widths

def style_table(rows, col_widths, header=True):
    t = Table(rows, colWidths=col_widths, hAlign='LEFT', repeatRows=1 if header else 0)
    cmds = [
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('TEXTCOLOR', (0, 0), (-1, -1), TEXT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.4, RULE),
        ('ROWBACKGROUNDS', (0, 1 if header else 0), (-1, -1),
         [white, LIGHT]),
    ]
    if header:
        cmds += [
            ('BACKGROUND', (0, 0), (-1, 0), NAVY),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ]
    t.setStyle(TableStyle(cmds))
    return t

def parse_table(raw_rows, header=True):
    rows = []
    for ri, r in enumerate(raw_rows):
        cells = [c.strip() for c in r.strip().strip('|').split('|')]
        style = ss['th'] if (header and ri == 0) else ss['body']
        rows.append([Paragraph(inline(c), style) for c in cells])
    return rows

# ---------- File Tree (Appendix B) ----------
TREE_PILL_BG = HexColor('#fce8c8')
TREE_ROW_ALT = HexColor('#fbf9f3')
TREE_LEGEND_BG = HexColor('#fafaf7')
TREE_ROOT_BG = HexColor('#f0ebd9')
TREE_DIVIDER = HexColor('#e8e4d8')

def parse_file_tree(code_lines):
    """Parse markdown tree lines into structured items.

    Each item is a dict: {depth, type ('dir'|'file'), name, description,
                          is_last, is_root}.
    """
    items = []
    for raw_line in code_lines:
        if not raw_line.strip():
            continue
        line = raw_line.rstrip()
        # Depth = number of │ vertical bars before any ─ or final connector
        # Pattern: optional (│ + any spaces)* then optional (├──|└──) then content
        m = re.match(r'^((?:│\s*)*)(├──|└──)?\s*(.*)$', line)
        if not m:
            continue
        prefix = m.group(1) or ''
        connector = m.group(2) or ''
        rest = m.group(3) or ''
        depth = prefix.count('│')
        is_last = connector == '└──'
        is_root = (not connector) and depth == 0
        if '#' in rest:
            name_part, _, desc_part = rest.partition('#')
            name = name_part.strip()
            description = desc_part.strip()
        else:
            name = rest.strip()
            description = ''
        # Continuation line: no name but a comment -> merge into previous description
        if not name and description and items:
            prev = items[-1]['description']
            items[-1]['description'] = (prev + ' ' + description).strip()
            continue
        if not name and not description:
            continue
        if name.endswith('/') or ('/' in name and not name.endswith(']')):
            type_ = 'dir'
            display_name = name.rstrip('/').strip()
        elif name.endswith(','):
            type_ = 'dir'
            display_name = name.rstrip(',').strip()
        else:
            type_ = 'file'
            display_name = name
        items.append({
            'depth': depth,
            'type': type_,
            'name': display_name,
            'description': description,
            'is_last': is_last,
            'is_root': is_root,
        })
    return items


def render_file_tree_section(subtitle, root_path, code_lines):
    """Build flowables for a clean, readable file tree section.
    
    Focuses on clarity and structure with minimal styling.
    """
    items = parse_file_tree(code_lines)
    flowables = []
    
    # Clean, minimal color palette
    BG_LIGHT = HexColor('#f9fafb')
    BG_ALT = HexColor('#f3f4f6')
    BORDER = HexColor('#e5e7eb')
    TEXT_DARK = HexColor('#111827')
    TEXT_MED = HexColor('#4b5563')
    TEXT_LIGHT = HexColor('#9ca3af')
    
    # 1. Simple root path header
    if root_path:
        root_html = (
            '<font name="Helvetica-Bold" color="#111827" size="11">'
            + esc(subtitle) + '</font><br/>'
            '<font name="' + _MONO_FONT + '" color="#6b7280" size="9">'
            + esc(root_path) + '</font>'
        )
        root_para = Paragraph(root_html, ss['body'])
        root_tbl = Table([[root_para]], colWidths=[USABLE_W])
        root_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LINEBELOW', (0, 0), (-1, -1), 1, BORDER),
        ]))
        flowables.append(root_tbl)
        flowables.append(Spacer(1, 12))
    
    # 2. Build clean tree table
    tree_style = ParagraphStyle('tree_cell', fontName=_MONO_FONT, fontSize=9,
                                textColor=TEXT_LIGHT, leading=13)
    name_style = ParagraphStyle('name_cell', fontName='Helvetica', fontSize=9.5,
                                textColor=TEXT_DARK, leading=13)
    desc_style = ParagraphStyle('desc', fontName='Helvetica', fontSize=8.5,
                                textColor=TEXT_MED, leading=12)
    
    rows = []
    for it in items:
        if it['is_root']:
            # Root directory - bold and prominent
            tree_cell = Paragraph('', tree_style)
            name_html = (
                '<font name="Helvetica-Bold" color="#111827" size="10">'
                + esc(it["name"]) + '/</font>'
            )
            name_cell = Paragraph(name_html, name_style)
        else:
            # Tree connector
            depth = it['depth']
            parts = ['│   '] * depth
            if it['is_last']:
                parts.append('└── ')
            else:
                parts.append('├── ')
            tree_text = ''.join(parts)
            tree_cell = Paragraph(tree_text.replace(' ', '&nbsp;'), tree_style)
            
            # Name - folders bold, files regular
            if it['type'] == 'dir':
                display = it['name']
                if not display.endswith('/') and ',' not in display and '(' not in display:
                    display += '/'
                name_html = (
                    '<font name="Helvetica-Bold" color="#111827">'
                    + esc(display) + '</font>'
                )
            else:
                name_html = '<font color="#374151">' + esc(it['name']) + '</font>'
            name_cell = Paragraph(name_html, name_style)
        
        # Description
        if it['description']:
            desc_cell = Paragraph(esc(it['description']), desc_style)
        else:
            desc_cell = Paragraph('', desc_style)
        
        rows.append([tree_cell, name_cell, desc_cell])
    
    # Create table with clean styling
    tree_col_w = 75
    name_col_w = 170
    desc_col_w = USABLE_W - tree_col_w - name_col_w
    
    tree_tbl = Table(rows, colWidths=[tree_col_w, name_col_w, desc_col_w], hAlign='LEFT')
    cmds = [
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        # Root row gets subtle background
        ('BACKGROUND', (0, 0), (-1, 0), BG_LIGHT),
        ('LINEBELOW', (0, 0), (-1, 0), 1, BORDER),
    ]
    
    # Add subtle alternating rows for readability
    for idx in range(1, len(rows)):
        if idx % 2 == 0:
            cmds.append(('BACKGROUND', (0, idx), (-1, idx), BG_ALT))
    
    tree_tbl.setStyle(TableStyle(cmds))
    flowables.append(tree_tbl)
    flowables.append(Spacer(1, 10))
    
    return flowables


# ---------- Parse ----------
lines = open('SOP.md', encoding='utf-8').read().split('\n')
story = []
i = 0
n = len(lines)
numbered = re.compile(r'^(\d+)\.\s+(.*)')
appendix = re.compile(r'^Appendix\s+([A-D])\s*(.*)')

# Track whether we've passed the manual TOC so we can skip it
skip_manual_toc = False
manual_toc_skipped = False

# State for Appendix B file-tree special rendering
in_appendix_b = False
last_h3 = None

# Cover page
story.append(Spacer(1, 50*mm))
story.append(Paragraph('STANDARD OPERATING PROCEDURE', ss['subtitle']))
story.append(Spacer(1, 8*mm))
story.append(Paragraph('Jinda POS Platform', ss['title']))
story.append(Spacer(1, 6*mm))
story.append(HRFlowable(width='50%', thickness=2, color=GOLD,
                        spaceBefore=4, spaceAfter=4, hAlign='CENTER'))
story.append(Spacer(1, 6*mm))
story.append(Paragraph('Complete Operations Guide', ss['subtitle']))
story.append(Spacer(1, 15*mm))

# Metadata in a clean table layout
meta_data = [
    ['<b>Document Version:</b>', '1.0'],
    ['<b>Last Updated:</b>', 'July 2026'],
    ['<b>Prepared for:</b>', 'Administrators, Developers, and End-Users']
]
meta_table_data = []
for label, value in meta_data:
    meta_table_data.append([
        Paragraph(label, ParagraphStyle('meta_label', fontName='Helvetica', fontSize=10,
                                        textColor=MUTE, alignment=TA_LEFT)),
        Paragraph(value, ParagraphStyle('meta_value', fontName='Helvetica', fontSize=10,
                                        textColor=TEXT, alignment=TA_LEFT))
    ])

meta_table = Table(meta_table_data, colWidths=[120, 300])
meta_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
]))
story.append(meta_table)

story.append(Spacer(1, 20*mm))
story.append(HRFlowable(width='30%', thickness=1, color=RULE,
                        spaceBefore=4, spaceAfter=8, hAlign='CENTER'))
story.append(Paragraph('Desktop Accounting &amp; POS System for Bhutanese Businesses',
                      ParagraphStyle('tagline', fontName='Helvetica-Oblique', fontSize=11,
                                    textColor=MUTE, alignment=TA_CENTER, leading=16)))
story.append(NextPageTemplate('content'))
story.append(PageBreak())

# Auto TOC
story.append(Paragraph('Table of Contents', ss['h1']))
toc = TableOfContents()
toc.levelStyles = [ss['toc1'], ss['toc2'], ss['toc3']]
story.append(toc)
story.append(PageBreak())

def add_heading(style, text, toc_level=None):
    p = Paragraph(inline(text), style)
    if toc_level is not None:
        p._toc = (toc_level, normalize_text(text))
    story.append(p)

while i < n:
    ln = lines[i]
    s = ln.strip()

    if s == '':
        i += 1
        continue

    if s.startswith('---'):
        story.append(Spacer(1, 2*mm))
        story.append(HRFlowable(width='100%', thickness=0.6, color=RULE,
                                spaceBefore=4, spaceAfter=6))
        i += 1
        continue

    # Skip the manual markdown TOC (## Table of Contents ... until next ---)
    if s.startswith('## Table of Contents'):
        i += 1
        # skip until we hit a --- or a ## heading
        while i < n and not (lines[i].strip().startswith('---')
                            or lines[i].strip().startswith('## ')):
            i += 1
        continue

    if s.startswith('# '):
        add_heading(ss['h1'], s[2:], None)
        i += 1
        continue

    if s.startswith('## '):
        txt = s[3:]
        m = numbered.match(txt)
        if m:
            add_heading(ss['h1'], txt, 0)
            in_appendix_b = False
        else:
            ap = appendix.match(txt)
            if ap:
                add_heading(ss['h1'], 'Appendix ' + ap.group(1) + ' ' + ap.group(2), 0)
                in_appendix_b = (ap.group(1) == 'B')
            else:
                add_heading(ss['h2'], txt, 1)
                in_appendix_b = False
        last_h3 = None
        i += 1
        continue

    if s.startswith('### '):
        txt = s[4:]
        add_heading(ss['h3'], txt, 2)
        last_h3 = txt
        i += 1
        continue

    if s.startswith('#### '):
        add_heading(ss['h4'], s[5:], None)
        i += 1
        continue

    if s.startswith('```'):
        # Special: Appendix B file trees get a modern visual style
        if in_appendix_b and last_h3 and re.match(r'^B\.\d', last_h3):
            m_head = re.match(
                r"^B\.\d+\s+(.+?)\s*\((?:Root:\s*)?`?([^`]+?)`?\)\s*$", last_h3)
            if m_head:
                subtitle = m_head.group(1).strip()
                root_path = m_head.group(2).strip()
            else:
                subtitle = last_h3
                root_path = ''
            code = []
            i += 1
            while i < n and not lines[i].strip().startswith('```'):
                code.append(lines[i]); i += 1
            i += 1
            for f in render_file_tree_section(subtitle, root_path, code):
                story.append(f)
            continue
        code = []
        i += 1
        while i < n and not lines[i].strip().startswith('```'):
            code.append(normalize_text(lines[i])); i += 1
        i += 1
        wrapped = wrap_code_block(code)
        # Use a Table to render the dark background reliably
        code_style = ParagraphStyle('code_p', fontName='Courier', fontSize=8.4,
                                    textColor=CODE_FG, leading=11.5)
        code_para = Preformatted(wrapped, code_style)
        code_tbl = Table([[code_para]], colWidths=[USABLE_W])
        code_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), CODE_BG),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(Spacer(1, 2))
        story.append(code_tbl)
        story.append(Spacer(1, 3))
        continue

    if s.startswith('> '):
        buf = []
        while i < n and lines[i].strip().startswith('> '):
            buf.append(lines[i].strip()[2:].strip()); i += 1
        joined = ' '.join(buf)
        low = joined.lower()
        if 'warning' in low:
            kind = 'warning'
        elif 'security' in low or 'never commit' in low or 'never' in low:
            kind = 'security'
        elif 'important' in low:
            kind = 'tip'
        else:
            kind = 'note'
        story.append(make_callout(joined, kind))
        story.append(Spacer(1, 4))
        continue

    if s.startswith('|'):
        raw = []
        while i < n and lines[i].strip().startswith('|'):
            raw.append(lines[i]); i += 1
        if raw and len(raw) > 1:
            sep_cells = [c.strip() for c in raw[1].strip().strip('|').split('|')]
            if all(re.match(r'^[-:\s]+$', c) for c in sep_cells):
                raw = raw[:1] + raw[2:]  # remove separator row, keep header
        if raw:
            n_cols = max(len(r.strip().strip('|').split('|')) for r in raw)
            col_widths = compute_col_widths(raw, n_cols)
            rows = parse_table(raw)
            if rows:
                story.append(style_table(rows, col_widths, header=True))
                story.append(Spacer(1, 4))
        continue

    # checkbox list (must come before plain bullet check)
    if re.match(r'^-\s+\[[ xX]\]', s):
        buf = []
        while i < n and re.match(r'^-\s+\[[ xX]\]', lines[i].strip()):
            m = re.match(r'^-\s+\[([ xX])\]\s*(.*)', lines[i].strip())
            mark = '[x]' if m.group(1).lower() == 'x' else '[ ]'
            buf.append(mark + ' ' + m.group(2)); i += 1
        items = [ListItem(Paragraph(inline(b), ss['bullet']), leftIndent=10) for b in buf]
        story.append(ListFlowable(items, bulletType='bullet', start='-',
                                  bulletFontName='Helvetica-Bold',
                                  bulletFontSize=12,
                                  bulletColor=SAFFRON, leftIndent=14))
        story.append(Spacer(1, 3))
        continue

    if s.startswith('- ') or s.startswith('* '):
        buf = []
        while i < n and (lines[i].strip().startswith('- ') or lines[i].strip().startswith('* ')):
            buf.append(lines[i].strip()[2:].strip()); i += 1
        items = [ListItem(Paragraph(inline(b), ss['bullet']), leftIndent=10) for b in buf]
        story.append(ListFlowable(items, bulletType='bullet',
                                  bulletFontName='Helvetica-Bold',
                                  bulletFontSize=12,
                                  bulletColor=CRIMSON,
                                  leftIndent=14))
        story.append(Spacer(1, 3))
        continue

    if re.match(r'^\d+\.\s+', s):
        buf = []
        while i < n and re.match(r'^\d+\.\s+', lines[i].strip()):
            buf.append(re.sub(r'^\d+\.\s+', '', lines[i].strip())); i += 1
        items = [ListItem(Paragraph(inline(b), ss['bullet']), leftIndent=10) for b in buf]
        story.append(ListFlowable(items, bulletType='1',
                                  bulletColor=ACCENT, leftIndent=14,
                                  bulletFontName='Helvetica-Bold',
                                  bulletFontSize=10))
        story.append(Spacer(1, 3))
        continue

    add_heading(ss['body'], ln)
    i += 1

doc = SOPDoc('SOP.pdf')
doc.multiBuild(story)
print('PDF created: SOP.pdf')
