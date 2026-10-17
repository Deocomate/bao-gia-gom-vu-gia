from common import *
with sync_playwright() as p:
    ctx, page, errs = new_ctx(p, user_dir=os.path.join(OUT, "profile4"))
    page.goto(URL); page.wait_for_timeout(1000)
    for n in (13, 30, 45):
        page.evaluate(f"""(()=>{{const d=S.draft; d.name='BAN THỜ 1.75- 1.95m'; d.altarSize='1M75 - 1M95';
          const ps=sortProducts([...S.products.values()].filter(p=>p.price!=null)).slice(20,20+{n});
          d.items=ps.map((p,i)=>({{lid:uid('l'),code:p.code,name:p.name,pattern:p.pattern,size:p.size,glaze:p.glaze,unit:p.unit,price:p.price,qty:(i%3)+1}})); renderItems();}})()""")
        with page.expect_download(timeout=60000) as dl:
            page.click("[data-act=pdf]")
        dl.value.save_as(f"{OUT}/fit{n}.pdf")
    print(errs); ctx.close()
