from common import *
with sync_playwright() as p:
    ctx, page, errs = new_ctx(p)
    page.goto(URL); page.wait_for_timeout(900)
    qid = page.evaluate("[...S.records.values()].find(r=>r.kind==='quote').id")
    # PDF của báo giá ngắn
    page.click("#tab-quotes"); page.wait_for_timeout(300)
    with page.expect_download(timeout=60000) as dl:
        page.click(f"[data-act=pdf][data-id='{qid}']")
    dl.value.save_as(os.path.join(OUT, "q_short.pdf"))
    with page.expect_download(timeout=60000) as dl:
        page.click(f"[data-act=png][data-id='{qid}']")
    dl.value.save_as(os.path.join(OUT, "q_short.png"))
    # Bộ dài: 40 dòng
    page.click("#tab-builder"); page.wait_for_timeout(300)
    page.evaluate("""(()=>{const d=S.draft; const ps=sortProducts([...S.products.values()].filter(p=>p.price!=null)).slice(0,40);
      d.items=ps.map((p,i)=>({lid:uid('l'),code:p.code,name:p.name,pattern:p.pattern,size:p.size,glaze:p.glaze,unit:p.unit,price:p.price,qty:(i%3)+1}));
      d.note='Bộ dài để thử phân trang.\\nDòng ghi chú thứ hai.'; d.vatNote='Giá chưa bao gồm VAT'; renderBuilder();})()""")
    page.wait_for_timeout(300)
    with page.expect_download(timeout=90000) as dl:
        page.click("[data-act=pdf]")
    dl.value.save_as(os.path.join(OUT, "q_long.pdf"))
    with page.expect_download(timeout=90000) as dl:
        page.click("[data-act=png]")
    dl.value.save_as(os.path.join(OUT, "q_long.png"))
    # Bản in: dựng trang vào #print-root rồi in ra PDF bằng chế độ in của Chromium
    page.evaluate("(async()=>{const pages=await buildExport(S.draft,false); const root=document.querySelector('#print-root'); root.innerHTML=''; pages.forEach(p=>root.appendChild(p));})()")
    page.wait_for_timeout(500)
    page.pdf(path=os.path.join(OUT, "q_print.pdf"), prefer_css_page_size=True, print_background=True)
    page.evaluate("document.querySelector('#print-root').innerHTML=''")
    # Chưa có giá → chặn xuất
    page.evaluate("S.draft.items[0].price=null; renderItems();")
    page.click("[data-act=pdf]"); page.wait_for_timeout(300)
    print("chặn xuất:", page.inner_text(".modal-b")[:160])
    page.click(".modal [data-close] >> nth=0")
    print("tạm tính:", page.text_content("#t-prov"))
    page.click("[data-act=preview]"); page.wait_for_timeout(1200)
    page.screenshot(path=f"{SHOT}/13_preview.png")
    print("errs:", errs)
    ctx.close()
EOF_PLACEHOLDER = 1
