#!env -S python -u

import json
import math
import re
import sys
import os


#
# The fix report is just the output of mkdocs serve, where it complains about links, put into a file
#
# INFO    -  Doc file 'faq/bigidea/README.md' contains an absolute link '/search/spots/dashboard/?band=20m&channel=269&callsign=KD2KDD&limit=2000&dtGte=2023-05-08&dtLte=2023-06-01', it was left as is.
# INFO    -  Doc file 'faq/bigidea/README.md' contains an absolute link '/faq/about', it was left as is. Did you mean '../about/README.md'?
# INFO    -  Doc file 'faq/channels/README.md' contains an absolute link '/tracker', it was left as is. Did you mean '../../tracker/README.md'?
# INFO    -  Doc file 'faq/channels/README.md' contains an absolute link '/search/spots/dashboard/?band=20m&channel=269&callsign=KD2KDD&limit=2000&dtGte=2023-05-08&dtLte=2023-06-01', it was left as is.
# INFO    -  Doc file 'faq/channels/README.md' contains an absolute link '/channelmap', it was left as is. Did you mean '../../channelmap/README.md'?
# INFO    -  Doc file 'faq/channels/README.md' contains an absolute link '/channelmap', it was left as is. Did you mean '../../channelmap/README.md'?
# INFO    -  Doc file 'faq/channels/README.md' contains an absolute link '/tracker', it was left as is. Did you mean '../../tracker/README.md'?
# INFO    -  Doc file 'faq/channels/README.md' contains an absolute link '/channelmap', it was left as is. Did you mean '../../channelmap/README.md'?
def FixLinks(fixReport):
    f = open(fixReport, "r", encoding="utf-8")
    fixReportBuf = f.read()
    f.close()

    lineSet = set()

    for line in fixReportBuf.split("\n"):
        if line not in lineSet:
            lineSet.add(line)

            if "contains an absolute link" in line:
                match = re.search(r"Doc file '(.*)' contains an absolute link '(.*)', it was left as is. Did you mean '(.*)'\?", line)

                if match:
                    inFile = match.group(1)
                    absLink = match.group(2)
                    relLink = match.group(3)

                    print(f"{inFile}: {absLink} => {relLink}")

                    f = open(inFile, "r", encoding="utf-8")
                    fBuf = f.read()
                    f.close()

                    lineListNew = []

                    for line in fBuf.split("\n"):
                        lineNew = line.replace(f"({absLink})", f"({relLink})")

                        lineListNew.append(lineNew)

                        if line != lineNew:
                            print(line)
                            print(lineNew)

                    fBufNew = "\n".join(lineListNew)
                    f = open(inFile, "w", encoding="utf-8")
                    f.write(fBufNew)
                    f.close()


#####################################################################
# Main
#####################################################################

def Main():
    if len(sys.argv) < 2 or (len(sys.argv) >= 1 and sys.argv[1] == "--help"):
        print("Usage: %s <rootDir>" % (os.path.basename(sys.argv[0])))
        sys.exit(-1)

    fixReport = sys.argv[1]

    FixLinks(fixReport)

    return 0

sys.exit(Main())
