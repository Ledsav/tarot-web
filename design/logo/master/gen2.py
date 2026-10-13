from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
from shapely import affinity

def bez(p0,p1,p2,p3,n=24):
    return [((1-t)**3*p0[0]+3*(1-t)**2*t*p1[0]+3*(1-t)*t*t*p2[0]+t**3*p3[0],
             (1-t)**3*p0[1]+3*(1-t)**2*t*p1[1]+3*(1-t)*t*t*p2[1]+t**3*p3[1]) for t in [i/n for i in range(1,n+1)]]
def qb(p0,p1,p2,n=12):
    return [((1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0],(1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]) for t in [i/n for i in range(1,n+1)]]
class P:
    def __init__(s,x,y): s.pts=[(x,y)]
    @property
    def cur(s): return s.pts[-1]
    def L(s,x,y): s.pts.append((x,y)); return s
    def Q(s,c,e): s.pts+=qb(s.cur,c,e); return s
    def C(s,c1,c2,e): s.pts+=bez(s.cur,c1,c2,e); return s
    def poly(s): return Polygon(s.pts).buffer(0)

TOP, BOT = 68, 188          # cap height 120
H = 4.5                     # hairline
ST = 20                     # stem
SER = 13                    # serif reach past stem
BR = 7.5                    # bracket depth

def letter_L():
    p=P(-SER,TOP).L(ST+SER,TOP).L(ST+SER,TOP+H).Q((ST,TOP+H),(ST,TOP+H+BR))
    p.L(ST,BOT-H).L(74,BOT-H).Q((85,BOT-H-4),(88,BOT-36)).L(90,BOT-36).L(90,BOT)
    p.L(-SER,BOT).L(-SER,BOT-H).Q((0,BOT-H),(0,BOT-H-BR)).L(0,TOP+H+BR).Q((0,TOP+H),(-SER,TOP+H))
    return p.poly()

def letter_U():
    r=78  # right thin stem x
    p=P(-SER,TOP).L(ST+SER,TOP).L(ST+SER,TOP+H).Q((ST,TOP+H),(ST,TOP+H+BR)).L(ST,142)
    p.C((ST,170),(29,184.5),(46,184.5)).C((63,184.5),(r,171),(r,142)).L(r,TOP+H+BR).Q((r,TOP+H),(r-11,TOP+H))
    p.L(r-11,TOP).L(r+H+11,TOP).L(r+H+11,TOP+H).Q((r+H,TOP+H),(r+H,TOP+H+BR)).L(r+H,142)
    p.C((r+H,174),(66,BOT+2),(44,BOT+2)).C((16,BOT+2),(0,172),(0,142)).L(0,TOP+H+BR).Q((0,TOP+H),(-SER,TOP+H))
    return p.poly()

def star(cx,cy,rv,rh,k):
    p=P(cx,cy-rv)
    p.Q((cx+rh*k,cy-rv*k),(cx+rh,cy)).Q((cx+rh*k,cy+rv*k),(cx,cy+rv)).Q((cx-rh*k,cy+rv*k),(cx-rh,cy)).Q((cx-rh*k,cy-rv*k),(cx,cy-rv))
    return p.poly()

def letter_X(thin=H, thick=22, serifs=True, star_rv=36, star_rh=24, k=0.09, moat=3):
    # thick: top-left -> bottom-right ; thin: top-right -> bottom-left
    y0,y1=TOP+(H if serifs else 0), BOT-(H if serifs else 0)
    import math
    d60=(y1-y0)/math.tan(math.radians(60))
    tl=4; br=tl+(76 if serifs else d60)
    mid=tl+thick/2+(br-tl)/2
    tr=mid-thin/2+d60/2; bl=tr-d60
    thick_s=Polygon([(tl,y0),(tl+thick,y0),(br+thick,y1),(br,y1)])
    thin_s=Polygon([(tr,y0),(tr+thin,y0),(bl+thin,y1),(bl,y1)])
    parts=[thick_s,thin_s]
    if serifs:
        parts+=[Polygon([(tl-11,TOP),(tl+thick+11,TOP),(tl+thick+11,TOP+H),(tl-11,TOP+H)]),
                Polygon([(tr-12,TOP),(tr+thin+12,TOP),(tr+thin+12,TOP+H),(tr-12,TOP+H)]),
                Polygon([(bl-13,BOT-H),(bl+thin+12,BOT-H),(bl+thin+12,BOT),(bl-13,BOT)]),
                Polygon([(br-11,BOT-H),(br+thick+11,BOT-H),(br+thick+11,BOT),(br-11,BOT)])]
    x=unary_union(parts)
    # crossing point of the two stroke centrelines
    cx=(tl+thick/2 + (tr+thin/2))/2; cy=(TOP+BOT)/2
    # centreline x at mid-height for thick: tl+thick/2 + (br-tl)/2
    cx=tl+thick/2+(br-tl)/2
    s=star(cx,cy,star_rv,star_rh,k)
    x=x.difference(s.buffer(moat,join_style=1))
    return unary_union([x,s]), (cx,cy)

def to_path(g, dx=0, dy=0, sc=1):
    g=affinity.scale(g,sc,sc,origin=(0,0)); g=affinity.translate(g,dx,dy)
    g=g.simplify(0.04)
    polys=[g] if isinstance(g,Polygon) else list(g.geoms)
    d=''
    for p in polys:
        for ring in [p.exterior,*p.interiors]:
            c=list(ring.coords)[:-1]
            d+='M'+'L'.join(f'{x:.2f} {y:.2f}' for x,y in c)+'Z'
    return d

def svg(w,h,d,vb_y=0): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {vb_y} {w} {h}"><title>LUX</title><path fill="#000" fill-rule="evenodd" d="{d}"/></svg>\n'

Lg=letter_L(); Ug=letter_U(); Xg,_=letter_X()
# optical spacing: L is open on the right, so U tucks closer
word=unary_union([affinity.translate(Lg,13+12,0), affinity.translate(Ug,13+12+90+10+13,0), affinity.translate(Xg,13+12+90+10+13+82.5+14+11,0)])
minx,miny,maxx,maxy=word.bounds
W=round(maxx+25)
open('lux-wordmark.svg','w').write(svg(W,256,to_path(word)))

# symbol: the lit X alone, centred in 256
sx=Xg; b=sx.bounds; s=200/ (b[3]-b[1])
cxs=(b[0]+b[2])/2*s; cys=(b[1]+b[3])/2*s
open('lux-x.svg','w').write(svg(256,256,to_path(sx,128-cxs,128-cys,s)))

# small-size cut: heavier hairlines, no serifs, bigger star, wider moat
sm,_=letter_X(thin=11, thick=24, serifs=False, star_rv=46, star_rh=32, k=0.12, moat=6)
b=sm.bounds; s=210/(b[3]-b[1]); cxs=(b[0]+b[2])/2*s; cys=(b[1]+b[3])/2*s
open('lux-x-small.svg','w').write(svg(256,256,to_path(sm,128-cxs,128-cys,s)))
print('ok', W)
