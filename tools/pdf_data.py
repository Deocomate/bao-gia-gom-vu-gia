# Dữ liệu chép từ PDF "Báo giá sản phẩm đồ thờ men lam – Bộ đồ thờ Phúc Liên Hoa" (GVG.B_ MEN LAM.pdf)
# Mỗi sản phẩm: (mục PDF, nhóm, tên, họa tiết, ĐVT, [(quy cách, giá men lam, giá vàng kim, ghi chú)], ghi chú chung)
# Giá cập nhật theo file "GVG. BẢNG GIÁ MEN LAM.xlsx" (10/2026): giá men lam mới; mục Long Phụng trong file chưa có giá nên chưa đưa vào
ML = "Men lam"
VV = "Men lam vẽ vàng"

P = [
 ("Bộ đỉnh hạc","Đỉnh hạc","Bộ đỉnh hạc tai rồng","Rồng","bộ",[("H57",23000000,38600000,"")],""),
 ("Bộ đỉnh hạc","Đỉnh hạc","Bộ đỉnh hạc tai rồng không đế","Rồng","bộ",[("",21500000,36500000,"")],""),
 ("Bộ đỉnh hạc","Đỉnh hạc","Đỉnh rồng","Rồng","cái",[("",13500000,21000000,"")],""),
 ("Bộ đỉnh hạc","Đỉnh hạc","Bộ đỉnh hạc tai mây","Mây","bộ",[("H57",20500000,37600000,"")],""),
 ("Bộ đỉnh hạc","Đỉnh hạc","Bộ đỉnh hạc tai mây không đế","Mây","bộ",[("",19000000,35500000,"")],""),
 ("Bộ đỉnh hạc","Đỉnh hạc","Đỉnh mây","Mây","cái",[("",11000000,20000000,"")],""),
 ("Bộ đỉnh hạc","Đỉnh hạc","Chân đế đỉnh","","cái",[("",1500000,2100000,"")],"PDF ghi “Chân đế” (mục Bộ đỉnh hạc)"),
 ("Bộ đỉnh hạc","Đỉnh hạc","Hạc","Hạc","đôi",[("H60",8000000,15500000,"H:60cm")],""),
 ("Bát hương song long liên hoa","Bát hương","Bát hương rồng kĩ","Rồng","chiếc",[
   ("Ø30",3000000,6600000,""),("Ø27",2650000,5300000,""),("Ø25",1450000,3700000,"H:22cm"),
   ("Ø22",850000,2500000,"H:19cm"),("Ø20",660000,2200000,"H:18cm"),("Ø18",530000,1900000,"H:17cm"),
   ("Ø16",480000,1750000,"H:15cm"),("Ø14",320000,1450000,"H:13cm"),("Ø12",250000,1200000,"H:12cm")],""),
 ("Bát hương vuốt song long liên hoa","Bát hương","Bát hương rồng kĩ vuốt","Rồng","chiếc",[
   ("Ø25",2650000,3800000,"H:22cm"),("Ø22",1200000,2500000,"H:19cm"),("Ø20",960000,2300000,"H:18cm"),
   ("Ø18",660000,2000000,"H:17cm"),("Ø16",550000,1850000,"H:15cm"),("Ø14",420000,1600000,"H:13cm")],""),
 ("Bát hương liên hoa","Bát hương","Bát hương sen","Sen","chiếc",[
   ("Ø25",1320000,3500000,"H:22cm"),("Ø22",780000,3500000,"H:19cm"),("Ø20",620000,2100000,"H:18cm"),
   ("Ø18",480000,1800000,"H:17cm"),("Ø16",380000,1600000,"H:15cm"),("Ø14",280000,1400000,"H:13cm"),
   ("Ø12",250000,1150000,"H:12cm")],""),
 ("Bát hương vuốt liên hoa","Bát hương","Bát hương sen vuốt","Sen","chiếc",[
   ("Ø25",2500000,3500000,"H:22cm"),("Ø22",1100000,2500000,"H:19cm"),("Ø20",930000,2200000,"H:18cm"),
   ("Ø18",800000,1900000,"H:17cm"),("Ø16",660000,1700000,"H:15cm"),("Ø14",325000,1500000,"H:13cm")],""),
 ("Đế sứ","Đế sứ bát hương","Đế sứ bát hương","","chiếc",[
   ("Ø14",280000,650000,"H:4,5cm, Ø13cm"),("Ø16",300000,750000,"H:5cm, Ø14,5cm"),
   ("Ø18",350000,850000,"H:5,5cm, Ø16,5cm"),("Ø20",380000,950000,"H:6cm, Ø18,5cm"),
   ("Ø22",540000,1150000,"H:6,5cm, Ø20,5cm"),("Ø25",580000,1250000,"H:8cm, Ø23,5cm")],"PDF ghi “Đế sứ BH”"),
 ("Lộc bình","Lọ lộc bình","Lộc bình sen","Sen","đôi",[
   ("H30",900000,2750000,"H:30cm, Ø11cm"),("H40",1250000,3200000,"H:40cm, Ø14cm")],""),
 ("Lộc bình","Lọ lộc bình","Lộc bình sen kĩ","Sen","đôi",[
   ("H25",1200000,2400000,"H:25cm, Ø9,5cm"),("H40",2650000,4200000,"H:40cm, Ø14cm"),("H50",4000000,6300000,"H:50cm, Ø18cm")],""),
 ("Lọ hoa miệng lượn sen","Lọ lộc bình","Lọ lượn sen","Sen","chiếc",[
   ("S1 (H35)",420000,1400000,"H:35cm, Ø13,5cm"),("S2 (H30)",340000,1200000,"H:29cm, Ø11cm"),
   ("S3 (H25)",265000,950000,"H:25cm, Ø10,5cm"),("S4 (H20)",160000,750000,"H:20cm, Ø8cm")],""),
 ("Lọ hoa dáng huệ","Lọ lộc bình","Lọ huệ sen","Sen","chiếc",[
   ("S1",265000,1050000,"H:30cm, Ø11cm"),("S2",220000,900000,"H:26cm, Ø10cm"),
   ("S3",160000,780000,"H:23cm, Ø8,5cm"),("S4",120000,680000,"H:20cm, Ø8cm")],""),
 ("Chóe thờ sen","Chóe","Chóe thờ sen","Sen","chiếc",[
   ("S1",220000,850000,"H:21cm - 800ml, ĐK miệng 6,5cm"),("S2",180000,750000,"H:19cm - 600ml, ĐK miệng 6cm"),
   ("S3",150000,650000,"H:16cm - 380ml, ĐK miệng 5cm"),("S4",120000,600000,"H:14cm - 200ml, ĐK miệng 4cm")],""),
 ("Mâm bồng sen","Mâm bồng","Mâm bồng sen","Sen","chiếc",[
   ("Ø35",1100000,1800000,"H:9cm"),("Ø32",950000,1600000,"H:9cm"),("Ø30",800000,1500000,"H:9cm"),
   ("Ø27",700000,1350000,"H:6,5cm"),("Ø25",550000,1200000,"H:6,5cm"),("Ø22",400000,1100000,"H:6cm"),
   ("Ø20",350000,1000000,"H:6cm"),("Ø18",300000,750000,"H:6cm"),("Ø16",265000,650000,"H:6cm")],""),
 ("Mâm bồng sen Phúc","Mâm bồng","Mâm bồng sen Phúc","Sen","chiếc",[
   ("Ø35",1260000,2000000,"H:9cm"),("Ø32",1100000,1700000,"H:9cm"),("Ø30",900000,1500000,"H:9cm"),
   ("Ø27",750000,1400000,"H:6,5cm"),("Ø25",600000,1300000,"H:6,5cm"),("Ø22",480000,1100000,"H:6cm"),
   ("Ø20",400000,1000000,"H:6cm"),("Ø18",320000,850000,"H:6cm")],""),
 ("Kỉ cong / kỉ ngai","Kỷ chén","Kỉ cong 3 sen","Sen","bộ",[("",150000,750000,"H:7cm x L:17,5cm")],""),
 ("Kỉ cong / kỉ ngai","Kỷ chén","Kỉ cong 5 sen","Sen","bộ",[("",220000,980000,"H:7cm x L:27cm")],""),
 ("Kỉ cong / kỉ ngai","Kỷ chén","Kỉ ngai 3 sen","Sen","bộ",[("",160000,850000,"H:8,5cm x L:20cm")],""),
 ("Kỉ cong / kỉ ngai","Kỷ chén","Kỉ ngai 5 sen","Sen","bộ",[("",250000,1050000,"H:9,5cm x L:30cm")],""),
 ("Kỉ cong / kỉ ngai","Kỷ chén","Chén kỉ sen","Sen","chiếc",[("",25000,105000,"H:3,5 x ĐK:4")],""),
 ("Bát trà sâm","Bát trà sâm","Bát sâm sen","Sen","bộ",[
   ("S1",220000,680000,"H:10,5cm, Ø10,5cm"),("S2",180000,600000,"H:9,5cm, Ø10cm")],""),
 ("Bát trà sâm","Bát trà sâm","Bát sâm sen kèm đế","Sen","bộ",[
   ("S1",240000,1000000,"H:13,5cm, Ø10,5cm"),("S2",220000,900000,"H:12,5cm, Ø10cm")],""),
 ("Nậm rượu","Nậm rượu","Nậm 2 bầu sen","Sen","chiếc",[("S1",200000,735000,"H:22cm"),("S2",165000,680000,"H:19cm")],""),
 ("Ống hương","Ống hương","Ống hương sen","Sen","chiếc",[("S1",200000,735000,"H:20cm, Ø10cm"),("S2",160000,680000,"H:18cm, Ø8,5cm")],""),
 ("Hũ phật thủ","Hũ phật thủ","Hũ phật thủ sen","Sen","chiếc",[("S1",250000,880000,"H:15,5cm, Ø13cm"),("S2",220000,800000,"H:14,5cm, Ø11,5cm")],""),
 ("Đèn dầu thờ cổ đồng","Đèn dầu","Đèn tròn sen","Sen","chiếc",[("S1",300000,780000,"H18cm - 300ml"),("S2",220000,680000,"H16cm - 200ml")],""),
 ("Đèn dầu thờ cổ đồng","Đèn dầu","Đèn Aladin sen","Sen","chiếc",[("",300000,780000,"H18cm - 300ml")],""),
 ("Đèn dầu thờ cổ đồng","Đèn dầu","Bóng đèn","","chiếc",[("",28000,0,"H11cm")],""),
 ("Bộ trà thờ","Bộ trà","Bộ ấm 5 chén cúng sen","Sen","bộ",[("",270000,1000000,"")],""),
 ("Bộ trà thờ","Bộ trà","Bộ ấm 3 chén cúng sen","Sen","bộ",[("",200000,800000,"")],""),
 ("Bộ trà thờ","Bộ trà","Chân đế bộ trà","","cái",[("",28000,320000,"H3,5cm")],"PDF ghi “Chân đế” (mục Bộ trà thờ)"),
 ("Bộ trà thờ","Bộ trà","Chén trà sen","Sen","chiếc",[("",20000,85000,"H3,5cm x ĐK 4,5cm")],""),
 ("Bộ trà thờ","Bộ trà","Đĩa trà sen","Sen","chiếc",[("S1",110000,380000,"Ø18cm"),("S2",80000,370000,"Ø15cm")],""),
 ("Bộ trà thờ","Bộ trà","Ấm trà sen","Sen","chiếc",[("",60000,360000,"H7,5cm x L14cm")],""),
 ("Bộ rượu cúng","Nậm rượu","Bộ nậm 3 chén cúng sen","Sen","bộ",[("",320000,1400000,"")],""),
 ("Bộ rượu cúng","Nậm rượu","Bộ nậm 5 chén cúng sen","Sen","bộ",[("",480000,1700000,"")],""),
 ("Bộ rượu cúng","Nậm rượu","Chân đế bộ rượu","","cái",[("",26000,320000,"")],"PDF ghi “Chân đế” (mục Bộ rượu cúng)"),
 ("Khay trầu / chân nến","Chân nến","Khay trầu/Chân nến sen","Sen","chiếc",[("S1",160000,440000,"H7cm x ĐK13cm")],""),
 ("Khay trầu / chân nến","Chân nến","Chân nến sen","Sen","chiếc",[("S2",105000,380000,"H6,5cm x ĐK 11cm"),("S3",80000,320000,"H6cm x ĐK10cm")],""),
 ("Bộ đồ ăn cúng","Bộ đồ ăn cúng","Bát cơm sen","Sen","chiếc",[("",55000,295000,"H5cm x ĐK11cm")],""),
 ("Bộ đồ ăn cúng","Bộ đồ ăn cúng","Bộ HMT sen vẽ tay 15 món","Sen","bộ",[("sz 45cm",2000000,6300000,"Bát tô: H7 x D20; Cánh: 13x17cm; Bát con: H5 x D11; Bát mắm: H4 x D8,5; Bát muối: H2 x D9")],""),
 ("Bộ đồ ăn cúng","Bộ đồ ăn cúng","Bộ HMT sen vẽ tay 7 món","Sen","bộ",[("sz 45cm",1600000,4300000,"Bát tô: H7 x D20; Cánh: 13x17cm; Bát con: H5 x D11; Bát mắm: H4 x D8,5; Bát muối: H2 x D9")],""),
 ("Bộ đồ ăn cúng","Bộ đồ ăn cúng","Bát gà sen vẽ tay","Sen","chiếc",[("",800000,1350000,"Dài:29 x Rộng:17 x Cao:8")],""),
 ("Bộ đồ ăn cúng","Bộ đồ ăn cúng","Bộ đũa sứ 6-10 thẳng/cong","","bộ",[("",265000,1050000,"")],""),
 ("Bộ đồ ăn cúng","Bộ đồ ăn cúng","Bộ đũa gỗ 6-10 thẳng/cong","","bộ",[("",160000,0,"")],""),
 ("Bộ đồ ăn cúng","Bộ đồ ăn cúng","Bát tô canh vẽ tay","Sen","chiếc",[("",686400,0,"")],"Lẻ từ bộ HMT sen vẽ tay"),
 ("Bộ đồ ăn cúng","Bộ đồ ăn cúng","Đĩa cánh vẽ tay","Sen","chiếc",[("",132000,0,"")],"Lẻ từ bộ HMT sen vẽ tay"),
 ("Bộ đồ ăn cúng","Bộ đồ ăn cúng","Bát cơm vẽ tay","Sen","chiếc",[("",66000,0,"")],"Lẻ từ bộ HMT sen vẽ tay"),
 ("Bộ đồ ăn cúng","Bộ đồ ăn cúng","Bát mắm, muối vẽ tay","Sen","chiếc",[("",52800,0,"")],"Lẻ từ bộ HMT sen vẽ tay"),
]

GC = {"Đỉnh hạc":"DH","Bát hương":"BH","Đế sứ bát hương":"DS","Lọ lộc bình":"LB","Chóe":"CH","Mâm bồng":"MB",
      "Kỷ chén":"KC","Bát trà sâm":"BS","Nậm rượu":"NR","Ống hương":"OH","Hũ phật thủ":"HP","Đèn dầu":"DD",
      "Bộ trà":"BT","Chân nến":"CN","Bộ đồ ăn cúng":"DA"}

def size_token(s):
    s = s.replace("Ø","D").replace("sz ","").replace(" ","")
    s = s.split("(")[0]
    return s

def wide_rows():
    """Một dòng mỗi quy cách, hai cột giá như PDF."""
    out = []
    for sec, grp, name, pat, unit, sizes, gnote in P:
        for size, ml, vk, note in sizes:
            n = "; ".join(x for x in [note, gnote] if x)
            out.append(dict(section=sec, group=grp, name=name, pattern=pat, size=size, unit=unit, ml=ml, vk=vk, note=n))
    return out

def variants():
    out, seen, seq = [], set(), {}
    ord_ = 0
    for sec, grp, name, pat, unit, sizes, gnote in P:
        g = GC[grp]
        seq[g] = seq.get(g, 0) + 1
        base = f"{g}{seq[g]:02d}"
        for size, ml, vk, note in sizes:
            n = "; ".join(x for x in [note, gnote] if x)
            for glaze, price, gcode in ((ML, ml, "ML"), (VV, vk, "VV")):
                code = base + (("-" + size_token(size)) if size else "") + "-" + gcode
                assert code not in seen, code
                seen.add(code)
                ord_ += 1
                active = True
                nn = n
                if price == 0:
                    price = None
                    active = False
                    nn = "; ".join(x for x in [n, "PDF ghi giá 0 – để trống, cần kiểm tra"] if x)
                out.append(dict(code=code, group=grp, name=name, pattern=pat, size=size, glaze=glaze,
                                unit=unit, price=price, note=nn, active=active, ord=ord_))
    return out

if __name__ == "__main__":
    v = variants()
    print(len(P), "sản phẩm,", len(wide_rows()), "quy cách,", len(v), "biến thể")
