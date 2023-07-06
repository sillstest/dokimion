from xml.parsers.expat import ExpatError
import xml.etree.ElementTree as ElementTree
import os, fnmatch
import shutil

def locate(pattern, root=os.curdir):
   for path, dirs, files in os.walk(os.path.abspath(root)):
      for filename in fnmatch.filter(files, pattern):
         yield os.path.join(path, filename)

def main():

   for xmlFile in locate("TEST-*.xml"):
      try:
         tree = ElementTree.parse(xmlFile);
         filename = os.path.basename(xmlFile);

         shutil.copy2(xmlFile, os.curdir);


      except (SyntaxError, ExpatError):
          print (xml, "\tBADLY FORMED!");


if __name__ == "__main__":
   main()





