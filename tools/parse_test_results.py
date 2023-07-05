from xml.parsers.expat import ExpatError
import xml.etree.ElementTree as ElementTree
import sys
import os, fnmatch

def locate(pattern, root=os.path.join(os.curdir, "../")):
  for path, dirs, files in os.walk(os.path.abspath(root)):
    for filename in fnmatch.filter(files, pattern):
      yield os.path.join(path, filename)

noTests = noErrors = noSkipped = noFailures = 0;

for xml in locate("TEST-*.xml"):
  try:
    tree = ElementTree.parse(xml);
    root = tree.getroot();

    for item in root.items():
      if item[0] == "tests":
        noTests += int(item[1])
      elif item[0] == "errors":
        noErrors += int(item[1])
      elif item[0] == "skipped":
        noSkipped += int(item[1])
      elif item[0] == "failures":
        noFailures += int(item[1])
         

  except (SyntaxError, ExpatError):
    print (xml, "\tBADLY FORMED!");


print("Tests:    ", noTests);
print("Errors:   ", noErrors);
print("Skipped:  ", noSkipped);
print("Failures: ", noFailures);




