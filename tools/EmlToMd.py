#!env -S python -u

import datetime
# https://docs.python.org/3/library/email.parser.html
import email
import re
import sys
import os


def ExtractInlineImages(msg, outDir):
    # Extract image attachments
    for part in msg.walk():
        # Content-Type: image/png; name="dummyfile.0.part"
        # (here this function would return "image/png")
        ct = part.get_content_type()
        ctPartList = ct.split("/")
        type = ctPartList[0]
        subtype = ctPartList[1]

        if type == "image":
            # X-Attachment-Id: attach_0_1763720F2ACBEBA8_8496@groups.io
            attachId = part.get("X-Attachment-Id")
            attachIdShort = attachId.split("@")[0]

            # Content-Disposition: inline; filename="dummyfile.0.part"
            cd = part.get_content_disposition()
            if cd == "inline":
                if not os.path.exists(outDir):
                    os.makedirs(outDir)

                outFile = os.path.join(outDir, f"{attachIdShort}.{subtype}")

                print(f"    {outFile}")

                with open(outFile, "wb") as f:
                    f.write(part.get_payload(decode=True))



def GetHtml(bufIn):
    buf = ""

    started = True
    for line in bufIn.split("\n"):
        if "<html>" in line:
            started = True
            buf += line
            buf += "\n"
        elif "</html>" in line:
            buf += line
            buf += "\n"
            started = False
        elif started:
            buf += line
            buf += "\n"

    return buf


def GetMostlyStrippedHtml(bufIn):
    buf = ""

    # simple swaps
    stripMap = {
        "<html>": "",
        "</html>": "",
        "<head>": "",
        "</head>": "",
        "<title>": "",
        "</title>": "",
        "<body>": "",
        "</body>": "",
        "<p>": "",
        "</p>": "",
        "<br/>": "\n",
        "&#34;": "\"",
        "&#39;": "\'",
    }

    sep = ""
    for line in bufIn.split("\n"):
        lineNew = line
        for tag, rep in stripMap.items():
            lineNew = lineNew.replace(tag, rep)

        buf += sep
        buf += lineNew

        sep = "\n"


    return buf;

def ConvertToMarkdown(bufIn):
    buf = ""
    
    # simple swaps
    stripMap = {
        "<h4>": "**",
        "</h4>": "**",
    }

    sep = ""
    for line in bufIn.split("\n"):
        lineNew = line
        for tag, rep in stripMap.items():
            lineNew = lineNew.replace(tag, rep)

        buf += sep
        buf += lineNew

        sep = "\n"

    bufNew = buf

    # regex
    buf = ""
    for line in bufNew.split("\n"):
        lineNew = line

        cont = True
        while cont:
            match = re.match(r'(<img src="cid:(.*)\@.*/>)', lineNew)

            if match:
                imgTag = match.group(1)
                tagName = match.group(2)

                mdTag = f"![]({tagName}.png)"

                lineNew = lineNew.replace(imgTag, mdTag)
            else:
                cont = False
        
        buf += lineNew
        buf += "\n"
        buf += "\n"

    return buf


def ExtractHtmlBodyAsMarkdown(msg):
    bufMd = ""

    for part in msg.walk():
        ct = part.get_content_type()

        if ct == "text/html":
            payload = part.get_payload(decode=True)
            bufRaw = payload.decode('utf-8')

            bufHtml = GetHtml(bufRaw)
            bufStripped = GetMostlyStrippedHtml(bufHtml)
            bufMd = ConvertToMarkdown(bufStripped)

            break

    return bufMd


def ExtractHtmlBodyAsMarkdownBlogFormat(msg, outFile, date):
    bufMd = ExtractHtmlBodyAsMarkdown(msg)

    def Add(str):
        return f"{str}\n"

    hdr  = ""
    hdr += Add(f"---")
    hdr += Add(f"date:")
    hdr += Add(f"  created: {date}")
    hdr += Add(f"")
    hdr += Add(f"categories:")
    hdr += Add(f"  - converted")
    hdr += Add(f"  - site")
    hdr += Add(f"---")
    hdr += Add(f"")
    hdr += Add(f"# {date}")
    hdr += Add(f"")
    hdr += Add(f"!!! note \"This entry is based on a converted groups.io post, put here for any documentation value.\"")
    hdr += Add(f"")

    print(f"    {outFile}")

    with open(outFile, "wb") as f:
        f.write(hdr.encode('utf-8'))
        f.write(bufMd.encode('utf-8'))


def EmlToMd(inFile, outRootDir):
    f = open(inFile, "r", encoding="utf-8")
    buf = f.read()
    f.close()

    msg = email.message_from_string(buf)

    # Sun, 28 May 2023 16:21:35 -0700
    dtStr = msg.get("Date")
    dtParsed = datetime.datetime.strptime(dtStr, "%a, %d %b %Y %H:%M:%S %z")
    yyyymmdd = dtParsed.strftime("%Y-%m-%d")
    yyyymmddhhmmss = dtParsed.strftime("%Y-%m-%d_%H-%M-%S")

    outDir = os.path.join(outRootDir, yyyymmddhhmmss)

    print(f"  {outDir}")

    if not os.path.exists(outDir):
        os.makedirs(outDir)

        outFile = os.path.join(outDir, f"{yyyymmddhhmmss}.md")
        ExtractHtmlBodyAsMarkdownBlogFormat(msg, outFile, yyyymmdd)

        ExtractInlineImages(msg, outDir)
    else:
        print("  ERR: output dir already exists")



def Main():
    if len(sys.argv) < 3 or (len(sys.argv) >= 1 and sys.argv[1] == "--help"):
        print("Usage: %s <inFile.eml> <outRootDir>" % (os.path.basename(sys.argv[0])))
        sys.exit(-1)

    outRootDir = sys.argv[1]
    inFileList = sys.argv[2:]

    for inFile in inFileList:
        print(f"Handling file {inFile}")
        EmlToMd(inFile, outRootDir)

    return 0


sys.exit(Main())
