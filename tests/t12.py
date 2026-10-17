from common import *
with sync_playwright() as p:
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile4"))
    page.goto(URL); page.wait_for_timeout(1000)
    for n in (13, 18, 24, 30, 40):
        r = page.evaluate(f"""(async()=>{{const d=clone(S.draft); d.name='BAN THỜ 1.75- 1.95m'; d.altarSize='1M75 - 1M95';
          const ps=sortProducts([...S.products.values()].filter(p=>p.price!=null)).slice(0,{n});
          d.items=ps.map((p,i)=>({{lid:uid('l'),code:p.code,name:p.name,pattern:p.pattern,size:p.size,glaze:p.glaze,unit:p.unit,price:p.price,qty:1}}));
          const pages=await buildExport(d,false); return [pages.length, pages.map(x=>x.className).join(',')];}})()""")
        print(n, "dòng ->", r)
        if n == 13: page.locator("#xp-stage .xp").first.screenshot(path=f"{SHOT}/80_one_page.png")
        if n == 24: page.locator("#xp-stage .xp").first.screenshot(path=f"{SHOT}/81_24rows.png")
    print(errs); ctx.close()
