#!env -S python -u

import json
import math
import re
import sys
import os



def GetHtmlRaw(bufIn):
    buf = ""

    lineList = bufIn.split("\n")

    # find start
    i = 0
    lineLast = ""
    while i < len(lineList):
        line = lineList[i]

        if line == "Content-Type: text/html; charset=\"utf-8\"":
            i += 3
            break

        lineLast = line
        i += 1

    # accumulate until end of this section
    sep = ""
    while i < len(lineList):
        line = lineList[i]
        if line == f"{lineLast}--":
            break
        else:
            buf += sep
            buf += line

            sep = "\n"
        
        i += 1

    return buf

# https://stackoverflow.com/questions/15621510/how-to-understand-the-equal-sign-symbol-in-imap-email-text
def DecodeQuotedPrintable(bufIn):
    buf = ""

    joinWithNewline = False
    for line in bufIn.split("\n"):
        if joinWithNewline:
            buf += "\n"

        if line == "":
            buf += "\n"
        else:
            if line[-1] == "=":
                buf += line[:-1]
            else:
                buf += line

        if line == "":
            joinWithNewline = False
        else:
            if line[-1] == "=":
                joinWithNewline = False
            else:
                joinWithNewline = True

    return buf

def GetHtml(bufIn):
    bufRaw = GetHtmlRaw(bufIn)
    bufDecoded = DecodeQuotedPrintable(bufRaw)


    buf = ""

    started = True
    for line in bufDecoded.split("\n"):
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

    # print(bufDecoded)
    # print(buf)

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
        "<h4>": "## ",
        "</h4>": "",
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
            match = re.match(r"(<img src=3D\"cid:(.*)\@.*/>)", lineNew)

            if match:
                imgTag = match.group(1)
                tagName = match.group(2)

                print(f"{imgTag}")
                print(f"{tagName}")

                mdTag = f"![]({tagName}.png)"

                lineNew = lineNew.replace(imgTag, mdTag)
            else:
                cont = False
        
        buf += lineNew
        buf += "\n"



    print(bufIn)
    print("----------------------------")
    print(buf)





def EmlToMd(inFile, outRootDir):
    f = open(inFile, "r", encoding="utf-8")
    buf = f.read()
    f.close()

    body = GetHtml(buf)
    stripped = GetMostlyStrippedHtml(body)
    md = ConvertToMarkdown(stripped)

    if body:
        pass
    else:
        print("no body")





def Main():
    if len(sys.argv) < 3 or (len(sys.argv) >= 1 and sys.argv[1] == "--help"):
        print("Usage: %s <inFile.eml> <outRootDir>" % (os.path.basename(sys.argv[0])))
        sys.exit(-1)

    inFile = sys.argv[1]
    outRootDir = sys.argv[2]

    EmlToMd(inFile, outRootDir)

    return 0


sys.exit(Main())
