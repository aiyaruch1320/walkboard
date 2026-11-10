# การติดตั้ง

หน้านี้บอกวิธีติดตั้ง Walkboard เปิดหน้าแรก และอัปเดตให้เป็นเวอร์ชันล่าสุดอยู่เสมอ

## สิ่งที่ต้องมี

ก่อนเริ่ม เช็กว่ามีสองอย่างนี้

- Claude Code จะใช้ใน terminal หรือแอป desktop ก็ได้ ถ้าใช้ agent อื่น เช่น Codex หรือ Gemini CLI ให้ดู [ใช้กับ agent อื่น](other-agents.md) แทน
- Node.js เวอร์ชัน 18.18 ขึ้นไป เช็กได้ด้วย `node -v`

ไม่ต้องสมัครบัญชี ไม่ต้องใช้ API key และไม่ต้องลง package อื่นเพิ่ม Walkboard ใช้ฟรีและเป็น open source (MIT licence) งานที่ agent ทำให้จะนับรวมกับการใช้งาน agent ตามปกติ เหมือนคำขออื่นๆ

Walkboard สร้างและใช้งานจริงทุกวันบน macOS กับ Chrome ทั้งใน terminal และแอป desktop automated test รันบน Linux และ Windows ด้วย แต่ยังไม่มีใครลองใช้จริงบนสองระบบนี้ ถ้าคุณได้ลอง ช่วยเล่าให้ฟังหน่อย

## ติดตั้ง plugin

**plugin** คือส่วนเสริมที่เพิ่มความสามารถให้ Claude Code ส่วน **marketplace** คือแหล่งที่ Claude Code ไปหา plugin มาติดตั้ง ใน Claude Code ให้เพิ่ม marketplace ของ Walkboard แล้วติดตั้ง plugin

```
/plugin marketplace add aiyaruch1320/walkboard
/plugin install walkboard@walkboard
```

จากนั้นเปิด session ใหม่ หรือรัน `/reload-plugins` แล้วจะเห็น `/walkboard` ในเมนูคำสั่ง

> **ควรรู้:** ถ้ามี plugin อื่นใช้คำสั่ง `/walkboard` อยู่แล้ว ให้พิมพ์ `/walkboard:walkboard` แทน

## เปิดหน้าแรก

เปิด Claude Code ใน repository ของคุณ แล้วลองพิมพ์อย่างใดอย่างหนึ่ง

```
/walkboard อธิบายว่าโปรเจกต์นี้เริ่มทำงานยังไง
/walkboard วางแผนเพิ่ม health check endpoint
/walkboard เทียบวิธีเก็บไฟล์ที่ผู้ใช้อัปโหลด
```

ไม่ต้องใช้คำสั่งก็ได้ ขอเป็นคำพูดธรรมดาก็ใช้ได้เหมือนกัน เช่น "ขอดูการทำงานของ login เป็นภาพ" ถ้าพิมพ์ `/walkboard` เฉยๆ agent จะดู repository แล้วเสนอเรื่องที่น่าดูมาให้สักสองสามเรื่อง

หลังจากนั้นจะเป็นแบบนี้

1. agent อาจถามสั้นๆ ไม่เกิน 3 ข้อ เฉพาะเมื่อคำตอบจะทำให้ภาพเปลี่ยน ถ้าเป็นแผน agent จะถามด้วยว่าให้ commit ให้เลย หรือแค่เสนอ commit message มาให้ agent จำคำตอบไว้ได้ ครั้งหน้าจะได้ไม่ถามซ้ำ
2. agent เขียนแผน แล้วส่งลิงก์หน้าตาประมาณ `http://127.0.0.1:…/?token=…` มาให้ เปิดลิงก์นั้นใน browser
3. คลิกกล่องเพื่อดูว่ามันทำอะไร ถ้าอยากถาม หรืออยากบอกว่าให้เพิ่ม แก้ หรือเอาอะไรออก พิมพ์ในช่องแชทด้านล่างของหน้า แล้ว **side panel** จะเปิดขึ้นมาให้คุยต่อในนั้น

ระหว่างใช้หน้าเว็บ ให้เปิด Claude Code ค้างไว้ด้วย เพราะ agent ทำงานอยู่ในนั้น จุดสีมุมขวาบนของหน้าบอกว่า agent พร้อมรับข้อความถัดไปหรือยัง สีเขียวคือกำลังฟัง สีม่วงคือกำลังตอบคุณ สีส้มคือกำลังทำอย่างอื่นอยู่

agent จะเลือกโหมดจากสิ่งที่คุณขอ อ่านเพิ่มเรื่องแต่ละโหมดได้ที่ [โหมดวางแผน](modes/plan.md) [โหมดอธิบาย](modes/explain.md) และ [โหมดออกแบบ](modes/design.md)

## ลองโดยไม่ใช้ agent

**ตัวอย่างจริง** (live example) คือหน้าที่ทำเสร็จแล้ว เปิดจากเว็บไซต์นี้ได้ทันที [ตัวอย่างภาพ](https://aiyaruch1320.github.io/walkboard/examples/pictures.html?view=flow&step=all) แสดงภาพทุกแบบของระบบเล็กๆ ระบบเดียว ส่วน [ตัวอย่างแพลตฟอร์ม](https://aiyaruch1320.github.io/walkboard/examples/platforms.html?view=aws&step=all) วาดแอปเดียวกันบนแต่ละ cloud คุณคลิกดูได้ทั่ว แต่ที่นั่นไม่มีใครตอบคำถาม

ถ้า clone repository มาแล้ว จะเปิดตัวอย่างเป็นหน้าที่ใช้งานได้จริงในเครื่องก็ได้

```bash
node skills/walkboard/bin/walkboard.mjs open examples/connect-vpcs
```

## อัปเดต Walkboard

Claude Code จะอัปเดต plugin ให้เองก็ต่อเมื่อคุณเปิด auto-update ให้ marketplace นั้น ถ้าอยากได้ Walkboard เวอร์ชันใหม่อัตโนมัติ เปิด `/plugin` ไปที่ **Marketplaces → walkboard** แล้วเลือก **Enable auto-update**

ถ้าจะอัปเดตเอง รันคำสั่งนี้

```
/plugin marketplace update walkboard
```

session ที่เปิดอยู่แล้วจะใช้เวอร์ชันที่เริ่มไว้ต่อไป รัน `/reload-plugins` หรือเปิด session ใหม่เพื่อใช้เวอร์ชันใหม่ เลขเวอร์ชันของหน้าเว็บดูได้ที่บรรทัดล่างสุดของเมนู **⋮** ถ้าหน้าเว็บเปิดด้วยเวอร์ชันเก่าทั้งที่ติดตั้งเวอร์ชันใหม่ไว้แล้ว agent จะบอกคุณ

## ถอนการติดตั้ง

ถ้าจะเอา plugin ออก รันคำสั่งนี้

```
/plugin uninstall walkboard@walkboard
```

แผนของคุณเก็บอยู่ใน `~/.walkboard/` และจะอยู่ตรงนั้นจนกว่าคุณจะลบ folder นั้นเอง

## อ่านต่อ

- [หน้าเว็บ](page.md): แต่ละส่วนของหน้าเว็บทำอะไร และคุยกับ agent บนหน้านั้นยังไง
- [คำถามที่พบบ่อย](faq.md): ทำยังไงเมื่อคลิกแล้วไม่มีอะไรเกิดขึ้น หรือไม่เห็น `/walkboard` ในเมนู
